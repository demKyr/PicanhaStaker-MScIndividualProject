
class queue:
    
    def __init__(self):
        self.Q = {}  
        self.first = 1
        self.last = 0

    def enqueue(self,data):
        self.last += 1
        self.Q[self.last] = data
        return

    def dequeue(self):
        if self.first > self.last:
            print(' the queue is empty')
            return
        data = self.Q[self.first]
        del self.Q[self.first]
        self.first += 1
        return data
    
    def isEmpty(self):
        if self.first > self.last: 
            return True
        else:
            return False
        
    def clear(self):
        self.Q = {}
        self.first = 1      # !!!! might not work in Solidity
        self.last = 0       # !!!! might not work in Solidity
        return



