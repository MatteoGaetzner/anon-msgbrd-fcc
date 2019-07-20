const ObjectId = require('mongodb').ObjectID
const MongoClient = require('mongodb')

module.exports = new function(){
  // Post Thread
  this.postThread = (req, res) => {
    const brdNme = req.params.board
    const thrdTxt = req.body.text
    const thrdPwd = req.body.delete_password
    
    MongoClient.connect(process.env.DB, (err, db) => {
      if(err){console.log(err)}
      
      db.collection(brdNme).insertOne({
        text: thrdTxt,
        created_on: Date.now(),
        bumped_on: Date.now(),
        reported: false,
        delete_password: thrdPwd,
        replies: []
      })
      res.redirect('/b/' + brdNme)
    })
  }
  
  // Post Comment
  this.postComment = (req, res) => {
    const brdNme = req.params.board
    const cmntTxt = req.body.text
    const cmntPwd = req.body.delete_password
    const thrdId = req.body.thread_id 
    console.log(req.params.board)
    
    MongoClient.connect(process.env.DB, async (err, db) => {
      if(err){console.log(err)}
      
      const newDoc = await db.collection(brdNme).findOneAndUpdate(
        {_id: new ObjectId(thrdId)},
        {
          $set: {
            bumped_on: Date.now()
          },
          $addToSet: {
            replies: {
              _id: new ObjectId(),
              text: cmntTxt,
              delete_password: cmntPwd,
              created_on: Date.now(),
              reported: false
            }
          }
        },
        {
          returnNewDocument: true
        }
      )
      
      res.redirect('/b/' + brdNme)
    })
  }
 
  // Compare Function for sorting threads array
  this.compareThreads = (a, b) => {
    const dateA = a.bumped_on,
          dateB = b.bumped_on
    
    if(dateA > dateB){
      return -1
    } else if(dateB > dateA){
      return 1
    }
    
    return 0        
  }
  
  // Compare Function for sorting replies array
  this.compareReplies = (a, b) => {
    const dateA = a.created_on,
          dateB = b.created_on
    
    if(dateA > dateB){
      return -1
    } else if(dateB > dateA){
      return 1
    }
    
    return 0        
  }
  
  // Get Board
  this.getBoard = (req, res) => {
    const brdNme = req.params.board;
    var outputArray = [];
    
    MongoClient.connect(process.env.DB, async (err, db) => {
      if(err){console.log(err)}
      
      const result = await db.collection(brdNme).find({}).toArray();
      
      result.sort(this.compareThreads)
      
      for(var i = 0; i < result.length; i++){
        // remove reported and delete_password from replies
        delete result[i].reported;
        delete result[i].delete_password;
        result[i].replies.sort(this.compareReplies)
        
        // we want 3 replies or less
        if(result[i].replies.length > 3){
          result[i].replies.length = 3;  
        }
        
        // remove reported and delete_password from replies
        for(var j = 0; j < result[i].replies.length; j++){
          if(result[i].replies[j]){
            delete result[i].replies[j].reported;
            delete result[i].replies[j].delete_password
          }
        }
        
        outputArray.push(result[i])
        if(i >= 10){return}
      }
      
      res.send(outputArray)
    })
  }
  
  // Get Thread
  this.getThread = (req, res) => {
    const brdNme = req.params.board;
    const thrdId = req.query.thread_id;
    var outputArray = [];
    
    MongoClient.connect(process.env.DB, async (err, db) => {
      if(err){console.log(err)}
      
      var result = await db.collection(brdNme).findOne(
        {
          _id: ObjectId(thrdId)
        }
      )
      
      // remove sensitive data
      delete result.reported;
      delete result.delete_password
      
      for(var i = 0; i < result.replies.length; i++){
        delete result.replies[i].reported
        delete result.replies[i].delete_password
      }
      
      res.send(result)
    })
  }
  
  // Modify Thread
  this.modifyThread = (req, res) => {
    const brdNme = req.params.board;
    const thrdId = req.body.thread_id;
    const thrdPwd = req.body.delete_password;
    
    MongoClient.connect(process.env.DB, async (err, db) => {
      if(err){console.log(err)}
      
      var result = await db.collection(brdNme).findOne({_id: ObjectId(thrdId)})
      
      // catch errors caused by non-existing thread
      try{
          // Check whether I need to delete or report
          if(thrdPwd !== undefined){
            // check whether password is correct
            if(result.delete_password === thrdPwd){
              db.collection(brdNme).deleteOne({_id: ObjectId(thrdId)})
              res.send('success')
            } else {
              res.send('incorrect password')
            }
          } else {
            db.collection(brdNme).updateOne(
                {_id: ObjectId(thrdId)},
                {$set: {reported: true}}
              )
            res.send('success')
          }
        } catch(err){
          res.send("This thread doesn't exist")
        }
    })
  }
  
  // Modify Comment 
  this.modifyComment = (req, res) => {
    const brdNme = req.params.board,
          thrdId = req.body.thread_id,
          cmntId = req.body.reply_id,
          cmntPwd = req.body.delete_password;
    
    MongoClient.connect(process.env.DB, async (err, db) => {
      if(err){console.log(err)}
      
      // catch errors caused by non-existing thread
      try{
        var result1 = await db.collection(brdNme).findOne({
          _id: ObjectId(thrdId)
        })
        
        // Loop over replies to get the comment matching cmntPdw
        for(var i = 0; i < result1.replies.length; i++){
        
          if(result1.replies[i]._id == cmntId){
            
            // Attempt to Delete Comment else report Comment
            if(cmntPwd){
              // Check whether password is correct
              if(result1.replies[i].delete_password === cmntPwd){
                // 'Delete Password'
                db.collection(brdNme).updateOne(
                  {_id: ObjectId(thrdId), "replies._id": ObjectId(cmntId)},
                  {
                     $set: { "replies.$.text": '[deleted]'}
                  }
                )
              }
              
            } else {
              // Report Comment
              db.collection(brdNme).updateOne( 
                  {_id: ObjectId(thrdId), "replies._id": ObjectId(cmntId)},
                  {
                     $set: { "replies.$.reported": true}
                  }
              )
            }
              res.send('success')
            } else {
              res.send('incorrect password')
            }
          }
        
      } catch(err){
        console.log(err)
        res.send("This comment doesn't exist")
      }
    })
  }
  
  // 
  
  
}