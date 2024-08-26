const express= require('express')
const cors=require('cors')
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
    //Post operation---------
    app.post('/addItem', async(req,res)=>{
        const item=req.body
        console.log(item)
        const result=await itemsCollection.insertOne(item)
          res.send(result)
      })
    app.post('/user', async(req,res)=>{
        const item=req.body
        console.log(item)
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
        console.log(item)
        const result=await ledgerCollection.insertOne(item)
          res.send(result)
      })

    app.post('/requisition', async(req,res)=>{
        const item=req.body

        const { q } = req.query;
        const queryItem=await requisitionCollection.findOne({ itemName: new RegExp(q, 'i') })
        console.log('quey item',queryItem)
        
        
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
    // app.get('/requisitedata',async(req,res)=>{
    //   const cursor=await requisitionCollection.find()
    //   const items=await cursor.toArray(cursor)
    //   res.send(items)
    // })

    app.get('/storeKeepers/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
  
      try {
          const cursor = await storeKeeperCollection.find(filter).toArray();
          res.send(cursor);
      } catch (error) {
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