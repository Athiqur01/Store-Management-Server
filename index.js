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

    //Post operation---------
    app.post('/addItem', async(req,res)=>{
        const item=req.body
        console.log(item)
        const result=await itemsCollection.insertOne(item)
          res.send(result)
      })

    app.post('/srb', async(req,res)=>{
        const item=req.body
        console.log(item)
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
        console.log(item)
        const result=await requisitionCollection.insertOne(item)
          res.send(result)
      })

    //get operation------
    app.get("/items", async(req,res)=>{
        const cursor=await itemsCollection.find()
        const items=await cursor.toArray(cursor)
        res.send(items)
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