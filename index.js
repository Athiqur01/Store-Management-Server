const express= require('express')
const cors=require('cors')
const jwt=require('jsonwebtoken')
const app= express()
const port=process.env.PORT||5012
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

//middleware-------
app.use(cors())
app.use(express.json())

//PlqORRhAnsVJ1L7F    
//mymensinghbetar








 const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mnncxar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const itemsCollection = client.db("MymensinghBetar").collection('Items');
    const srbCollection = client.db("MymensinghBetar").collection('srb');
    const ledgerCollection = client.db("MymensinghBetar").collection('ledger');
    const requisitionCollection = client.db("MymensinghBetar").collection('requisition');
    const storeKeeperCollection = client.db("MymensinghBetar").collection('StoreKeeper');
    const userCollection=client.db("MymensinghBetar").collection('User')
    const sibCollection = client.db("MymensinghBetar").collection('sib');
    const requisitionRegisterCollection = client.db("MymensinghBetar").collection('reqRegister');
    //Post operation---------

    //jwt api---
    app.post('/jwt', async(req,res)=>{
      const user=req.body
      const token=jwt.sign(user,process.env.Access_TOKEN_SECRET, {expiresIn:'1h'})
      res.send({token})
    })
    //middleware for verify token
    const verifyToken=(req,res,next)=>{
      console.log('inside  verify token', req.headers.authorization)
      if(!req.headers.authorization){
        return res.status(401).send({message:'Access forbidden'})
      }
    const token=req.headers.authorization.split(' ')[1]
    jwt.verify(token, process.env.Access_TOKEN_SECRET,
      (err,decode)=>{
        if(err){
          return res.status(401).send({message:'Access forbidden'}) 
        }
        req.decode=decode
        next()
      }
    )
    }

    //verify admin after verify token
    const verifyAdmin=async(req,res,next)=>{
      const email=req.decode.email
      const query={email:email}
      const user=await userCollection.findOne(query)
      const isAdmin=user?.status==='admin'
      if(!isAdmin){
        return res.status(403).send({message:'Access forbidden'})
      }
      next()
    }

    app.post('/addItem', async(req,res)=>{
        const item=req.body
        //console.log(item)
        const result=await itemsCollection.insertOne(item)
          res.send(result)
      })
    app.post('/user', async(req,res)=>{
        const item=req.body
        //console.log(item)
        const result=await userCollection.insertOne(item)
        res.send(result)
      })

    app.post('/srb', async(req,res)=>{
        const item=req.body
        const result=await srbCollection.insertOne(item)
          res.send(result)
      })

    app.post('/ledger', async(req,res)=>{
        const item=req.body
        //console.log(item)
        const result=await ledgerCollection.insertOne(item)
          res.send(result)
      })

      app.post('/sib', async(req,res)=>{
        const item=req.body
        const result=await sibCollection.insertOne(item)
        const result2=await ledgerCollection.insertOne(item)
          res.send(`successful post in sib ${result},successful post in ledger:${result2}`)
      })

      app.post('/sibLedger', async(req,res)=>{
        const item=req.body
        const result=await ledgerCollection.insertOne(item)
          res.send(result)
      })


      app.post('/requisition/register', async(req,res)=>{
        const item=req.body
        const result=await requisitionRegisterCollection.insertOne(item)
        res.send(result)
      })


    app.post('/requisition', async(req,res)=>{
        const item=req.body

        const { q } = req.query;
        const queryItem=await requisitionCollection.findOne({ itemName: new RegExp(q, 'i') })
        //console.log('quey item',queryItem)
        
        
         if(queryItem){
           return res.send('item is exist')
         }
        
         const result=await requisitionCollection.insertOne(item)
          res.send(result)
         
      })

      app.post('/storeKeeper', async(req,res)=>{   // Post Operation to store keeper
        const item=req.body
        const result=storeKeeperCollection.insertOne(item)
        res.send(result)
        
      })

    //get operation------
    app.get("/items", async(req,res)=>{
        const cursor=await itemsCollection.find()
        const items=await cursor.toArray(cursor)
        res.send(items)
    })

    app.get("/itemmessage", async(req,res)=>{
        const items = await itemsCollection.find({
          $expr: { $gt: [{ $toInt: "$minimumQuantity" }, { $toInt: "$quantity" }] }
        }).toArray();
        console.log('iyty',items)
       // const items=await cursor.toArray(cursor)
        res.send(items)
    })

    app.get("/users",verifyToken, async(req,res)=>{
        console.log(req.headers)
        const cursor=await userCollection.find()
        const users=await cursor.toArray(cursor)
        res.send(users)
    })

    app.get('/adminuser/:email',verifyToken,verifyAdmin, async(req,res)=>{
      const email=req.params.email
      if (email !== req.decode?.email){
        return res.status(403).send({message:'Unauthorize access'})
      }
      const query={email:email}
      const user=await userCollection.findOne(query)
      let admin=false
      if(user){
        admin=user?.status==='admin'
      }
      res.send({admin})
    })

    // Search products by name
  app.get("/item", async(req,res)=>{
    const { q } = req.query;
    const items=await itemsCollection.find({ itemName: new RegExp(q, 'i') }).toArray()
    res.send(items)
  })


  app.get("/user", async(req,res)=>{
    const { email } = req.query;
    const user=await userCollection.findOne({ email: new RegExp(email, 'i') })
    res.send(user)
  })
    



  app.get('/storeKeepers/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };

    try {
        // Find the storeKeeper document by ID
        const storeKeeper = await storeKeeperCollection.findOne(filter);

        if (!storeKeeper) {
            return res.status(404).send({ message: 'StoreKeeper not found' });
            
        }
        // Extract the item IDs from LocalStorageItem array
        const itemIds = storeKeeper.LocalStorageItem.map(item => new ObjectId(item._id));
        // Find the corresponding items in itemsCollection
        const items = await itemsCollection.find({ _id: { $in: itemIds } }).toArray();
        

        // Merge the item details with the storeKeeper data
        const detailedItems = storeKeeper.LocalStorageItem.map(localItem => {
          const fullItemDetails = items.find(item => item._id.toString() === localItem._id);
          return {
              ...localItem,
              fullItemDetails
          };
      });

      // Attach the detailed items to the storeKeeper object
      storeKeeper.LocalStorageItem = detailedItems;

      res.send(storeKeeper);

      //console.log('itemsIds',storeKeeper)

    } 
    catch (error) {
        console.error('Error fetching store keeper:', error);
        res.status(500).send({ message: 'Failed to fetch store keeper data', error });
    }
});





    app.get('/storeKeeper',async(req,res)=>{
      const cursor=await storeKeeperCollection.find()
      const items=await cursor.toArray(cursor)
      res.send(items)
    })

    
    app.get("/adminData", async(req,res)=>{
      const filter = { isChecked: true };
        const checkedItems = await storeKeeperCollection.find(filter).toArray();
        res.send(checkedItems);
    })

    app.get("/keeperData", async(req,res)=>{
      const filter = { isChecked: false };
        const checkedItems = await storeKeeperCollection.find(filter).toArray();
        res.send(checkedItems);
    })

    app.get('/count', async (req, res) => {
      try {
        const count = await itemsCollection.countDocuments();
        res.json({ totalItems: count });
      } catch (error) {
        res.status(500).json({ error: 'Failed to count items' });
      }
    });

    app.get('/sib/count', async (req, res) => {
      try {
        const count = await sibCollection.countDocuments();
        res.json({ totalItems: count });
      } catch (error) {
        res.status(500).json({ error: 'Failed to count items' });
      }
    });

    app.get('/srb/count', async (req, res) => {
      try {
        const count = await srbCollection.countDocuments();
        res.json({ totalItems: count });
      } catch (error) {
        res.status(500).json({ error: 'Failed to count items' });
      }
    });

    app.get('/sibdata', async(req,res)=>{
      const cursor=await sibCollection.find().toArray()
     // console.log('sib:',cursor)
      res.send(cursor)
    })

    app.get('/srbdata', async(req,res)=>{
      const cursor=await srbCollection.find().toArray()
     // console.log('sib:',cursor)
      res.send(cursor)
    })

    app.get('/ledgerdata', async(req,res)=>{
      const cursor=await itemsCollection.find().toArray()
     // console.log('sib:',cursor)
      res.send(cursor)
    })

    //ledger data using pagenation
    app.get("/shortedItem", async(req,res)=>{
      const { q } = req.query;
  
      const page = parseInt(req.query.page, 10) || 0; // default to 0 if not provided
      const size = parseInt(req.query.size, 10) || 10; // default to 10 if not provided
      const items=await itemsCollection.find()
      .skip(page * size)
      .limit(size)
      .toArray()
      res.send(items) 
  })


    app.get('/reqregister', async(req,res)=>{
      const cursor=await requisitionRegisterCollection.find().toArray()
     // console.log('sib:',cursor)
      res.send(cursor)
    })

    app.get("/ledgerdetail", async(req,res)=>{
      const {q} = req.query;
      const items=await ledgerCollection.find({ itemName: new RegExp(q, 'i') }).toArray()
      res.send(items)
      console.log('item name:',items)
    })
    app.get("/requisitiondownload/:id", async(req,res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const items=await requisitionRegisterCollection.findOne(filter)
      res.send(items)
      console.log('item name:',items)
    })

    app.get("/reqitems", async(req,res)=>{        //my requisition for deshboard
      const { q } = req.query;
      const items=await requisitionRegisterCollection.find({ 
        "registerData.requisitionBy": new RegExp(q, 'i') }).toArray()
      res.send(items)
    })

    //Delete Operation------------
    app.delete("/viewdetail/:id",async(req,res)=>{
      const id=req.params.id
      console.log('idddd',id)
      const query={_id:new ObjectId(id)}
      const result=await storeKeeperCollection.deleteOne(query)
      res.send(result)
    })
    

    
    //Patch operation------------
    app.patch('/items/:itemName', async(req,res)=>{
      const {itemName}= req.params
      const filter={itemName}
      const option={upsert:true}
      const updatedItem=req.body
      const item={
        $set:{
          quantity:updatedItem?.quantity
        }
      }
      const result=await itemsCollection.updateOne(filter,item,option)
      res.send(result)
    })

    //Patch operation for requisition------------
    app.patch('/items/:id', async(req,res)=>{
      const id= req.params.id
      const filter={_id: new ObjectId(id)}
      const option={upsert:true}
      const updatedItem=req.body
      const item={
        $set:{
          quantity:updatedItem?.newStock
        }
      }
      const result=await itemsCollection.updateOne(filter,item,option)
      res.send(result)
    })


    app.patch('/updatestatus/:id', async(req,res)=>{
      const id= req.params.id
      const filter={_id: new ObjectId(id)}
      const option={upsert:true}
      const {updateStatus}=req.body
      const item={
        $set:{
          status:updateStatus
        }
      }
      const result=await userCollection.updateOne(filter,item,option)
      res.send(result)
    })
    //Patch operation for update item------------
    app.patch('/updateitem', async(req,res)=>{
      const {q}= req.query
      const filter={ itemName: new RegExp(q, 'i') }
      const option={upsert:true}
      const updatedItem=req.body
      const item={
        $set:{
          quantity:updatedItem?.newStock
        }
      }
      const result=await itemsCollection.updateOne(filter,item,option)
      res.send(result)
    })

    //Patch operation for balance update------------
    app.patch('/balance', async(req,res)=>{
      const {q}= req.query

      const filter={ itemName: new RegExp(q, 'i') }
      const option={upsert:true}
      const updatedItem=req.body
      const item={
        $set:{
          quantity:updatedItem?.balance
        }
      }
      const result=await itemsCollection.updateOne(filter,item,option)
      res.send(result)


      
      console.log('balance:',updatedItem)
    })
  
    app.patch('/keeper/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedItem = req.body;
  
      // Log the incoming request body
      console.log('Updated Item:', updatedItem);
  
      // Construct the update object
      const item = {
          $set: {
              isChecked: updatedItem?.isChecked
          }
      };
  
      try {
          const result = await storeKeeperCollection.updateOne(filter, item, option);
          res.send(result);
      } catch (error) {
          console.error('Error updating item:', error);
          res.status(500).send({ message: 'Failed to update item', error });
      }
  });

 // PATCH route to update demand for a specific item in StoreKeeper collection
 app.patch('/storeKeeper/:storeKeeperId/item/:itemId', async (req, res) => {
  try {
      const { storeKeeperId, itemId } = req.params;
      const { demand } = req.body;

      const filter = { _id: new ObjectId(storeKeeperId), "LocalStorageItem._id": itemId };
      const updateDocument = { $set: { "LocalStorageItem.$.demand": demand } };

      const result = await storeKeeperCollection.updateOne(filter, updateDocument);

      if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'Item not found or storeKeeper not found' });
      }

      res.send({ message: 'Demand updated successfully', result });
  } catch (err) {
      console.error("Error updating demand:", err);
      res.status(500).send({ error: 'Failed to update demand' });
  }
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req,res)=>{
    res.send('Store management is running')
})

app.listen(port, ()=>{
    console.log(`Store management is running on port ${port}`)
})