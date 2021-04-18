pragma solidity ^0.5.0;

library OptimBookerLib {

    struct Node {
        /// Booking's start date in seconds
        uint fromDate;
        /// Booking's end date in seconds
        uint toDate;
        uint bid;
        uint next;
    }

    struct Storage {                   //使用自定义数据结构来存储相关的信息
        uint nextPos;
        mapping (uint => Node) nodes;   //listing>storage>nodes>node
    }

    uint constant HEAD = 0;
    uint constant JUNK = 2^256-1; // We assume there won't be that many bookings

    int public constant NOT_FOUND = -1;             //错误类型
    int public constant BOOK_CONFLICT = -2;

    event Booked(uint bid);                          //事件
    event Cancelled(uint bid);
    event Log(uint, uint);

    /// The list is empty if the HEAD node points to itself
    function isEmpty(Storage storage self) public view returns (bool)    //查看是否为空
    {
        return self.nodes[HEAD].next == HEAD;
    }

    function createLink(Storage storage self, uint fromNode, uint toNode) private    //这是什么连接？
    {
        self.nodes[fromNode].next = toNode;
    }

    function _printAll(Storage storage self) public    //打印所有
    {
        uint curr = self.nodes[HEAD].next;
        while (curr != HEAD) {
            emit Log(self.nodes[curr].fromDate, self.nodes[curr].toDate);
            curr = self.nodes[curr].next;
        }
    }

    function _printJunk(Storage storage self) public
    {
        if (!junkIsEmpty(self)) {
            uint curr = self.nodes[JUNK].next;
            while (curr != JUNK) {
                emit Log(self.nodes[curr].fromDate, self.nodes[curr].toDate);
                curr = self.nodes[curr].next;
            }
        }
    }

    /// Returns true if junk is initialised: if it points to itself
    function junkNotInitialised(Storage storage self) private view returns (bool)
    {
        return self.nodes[JUNK].next == 0;
    }

    function junkIsEmpty(Storage storage self) private view returns (bool)
    {
        return junkNotInitialised(self) || self.nodes[JUNK].next == JUNK;
    }

    // Adds the provided node to junk                          //junk可能只是一个缓存
    function addJunk(Storage storage self, uint node) private
    {
        require(node != JUNK, 'Cannot add provided node to Junk');
        if (junkNotInitialised(self)) {
            self.nodes[JUNK].next = JUNK;
        }
        createLink(self, node, self.nodes[JUNK].next);
        createLink(self, JUNK, node);
    }

    /// Pops the junk node at head of list and returns its index
    function popJunk(Storage storage self) private returns (uint)
    {
        uint ret = self.nodes[JUNK].next;
        createLink(self, JUNK, self.nodes[ret].next);
        return ret;
    }

    /// Free all junk storage kept for reuse
    function freeJunk(Storage storage self) public
    {
        while (!junkIsEmpty(self)) {
            uint idx = popJunk(self);
            delete self.nodes[idx];
        }
    }

    /// Removes node from the list. Requires the prevNode be provided.
    function removeNode(Storage storage self, uint node, uint prevNode) private
    {
        createLink(self, prevNode, self.nodes[node].next);
        addJunk(self, node);
    }

    /// Returns the next available position and updates it
    function useNextPos(Storage storage self) public returns (uint pos)
    {
        if (junkIsEmpty(self)) {
            return self.nextPos++;
        } else {
            // Recycle node
            return popJunk(self);
        }
    }

    function newNode(Storage storage self, uint prevNode, uint nextNode, uint bid, uint fromDate, uint toDate) private
    {                                          //新建一个
        uint nextPos = useNextPos(self);
        Node memory n = Node({
            fromDate: fromDate,
            toDate: toDate,
            bid: bid,
            next: nextNode
        });
        createLink(self, prevNode, nextPos);
        createLink(self, nextPos, nextNode);  // redundant, but there for readability
        self.nodes[nextPos] = n;
    }

    /// Called by book function
    ///
    ///     - Creates a new LinkedList node
    ///     - Emits Booking event
    ///     - Updates nextBid
    function newBook(Storage storage self, uint prevNode, uint nextNode, uint bid, uint fromDate, uint toDate)
        private returns (uint)                                                  
    {
        require(toDate > fromDate, 'fromDate must be less than toDate');
        newNode(self, prevNode, nextNode, bid, fromDate, toDate);        //成功后将新的订阅期打包到房屋订阅信息nodes里
        emit Booked(bid);                                   //一个监督函数？
        return bid;
    }

    function initialise(Storage storage self) public
    {
        self.nextPos = 1;
        // self.nodes[HEAD].next = HEAD; // (implicit since HEAD = 0)
        self.nodes[JUNK].next = JUNK;
    }

    function book(Storage storage self, uint bid, uint fromDate, uint toDate) public returns (int)  //使用self直接传入Storage类对象
    {
        require(fromDate < toDate, 'Invalid dates provided');
        uint prev = HEAD;
        uint curr = self.nodes[HEAD].next;   //next可能是记录下一个订阅会是什么号
        while (curr != HEAD) {
            uint currFrom = self.nodes[curr].fromDate;
            uint currTo = self.nodes[curr].toDate;
            if (fromDate >= currTo) {                           //订阅的时间大于当前最新的订阅期直接进行下一步正式订阅
                return int(newBook(self, prev, curr, bid, fromDate, toDate));   //依然将最开始订阅时传入的参数继续传递下去，以及self
            } else if (toDate <= currFrom) {
                prev = curr;
                curr = self.nodes[curr].next;
            } else {
                return BOOK_CONFLICT;
            }
        }
        return int(newBook(self, prev, HEAD, bid, fromDate, toDate));
    }

    function cancel(Storage storage self, uint bid) public returns (int)
    {
        uint prev = HEAD;
        uint curr = self.nodes[prev].next;
        // Find node with matching bid, then remove it
        while (curr != HEAD) {
            if (self.nodes[curr].bid == bid) {
                removeNode(self, curr, prev);
                emit Cancelled(bid);
                return int(bid);
            }
            prev = curr;
            curr = self.nodes[curr].next;
        }
        return NOT_FOUND;
    }

    function cancelPastBookings(Storage storage self) public
    {
        uint curr = self.nodes[HEAD].next;
        while (curr != HEAD) {
            if (self.nodes[curr].toDate < now) {
                break;
            }
            curr = self.nodes[curr].next;
        }
        // Add all bookings starting from curr to junk
        while (curr != HEAD) {
            addJunk(self, curr);
            curr = self.nodes[curr].next;
        }
    }

    /// Return index of found id
    function find(Storage storage self, uint id) public view returns (int) {
        uint curr = self.nodes[HEAD].next;
        while (curr != HEAD) {
            if (self.nodes[curr].bid == id) {
                return int(curr);
            }
            curr = self.nodes[curr].next;
        }
        return NOT_FOUND;
    }

    function hasActiveBookings(Storage storage self) public view returns (bool)
    {
        uint first = self.nodes[HEAD].next;
        return self.nodes[first].toDate >= now;
    }

    function getDates(Storage storage self, uint id) public view returns (uint fromDate, uint toDate) {
        int idx = find(self, id);
        require(idx != NOT_FOUND, 'Entry not found');
        Node memory node = self.nodes[uint(idx)];
        return (node.fromDate, node.toDate);
    }
}
