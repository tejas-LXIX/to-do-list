const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app=express();
app.set('view engine','ejs');   //tell our app to use EJS. The view engine is responsible for creating HTML from your views. Views are usually some kind of mixup of HTML and a programming language. The pattern behind most of these is called two-step view. Responsible for rendering your view, and converting your code into HTML.

//templates are required to prevent the need to rewrite the code for responses that are very similar to each other. EG: templates prevent the need to create 7 different html pages for each day of the week.
//we use EJS for templating.

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static("public"));  //to tell express to serve up all the static files. these static files are in the public directory.

mongoose.connect("mongodb://localhost:27017/todolistDB",{ useNewUrlParser: true });

const itemsSchema={
    name:String
};

const Item=mongoose.model("Item",itemsSchema);
const item1=new Item({
    name:"Welcome to your todolist!"
});
const item2=new Item({
    name:"Hit + to add a new item"
});
const item3=new Item({
    name:"Hit checkbox to delete an item"
});

const defaultItems=[item1,item2,item3];



const listSchema={
    name:String,
    items:[itemsSchema]
}
const List=mongoose.model("List",listSchema);



app.get("/",(req,res)=>{
    Item.find({},(err,foundItems)=>{
        if(foundItems.length===0){  
            Item.insertMany(defaultItems,(err)=>{
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Successfully saved items to DB");
                }
            });
            res.redirect("/");
        }
        res.render("list",{listTitle:"Today",newItems:foundItems});    //uses the view engine to render a particular page of .ejs extension. These pages have to be inside a "views" folder. Here, it looks for a file called list inside the views folder.
        //Passing a javascript object with key 'listTitle' and value "Today" to index.ejs. listTitle is the variable name in the list.ejs file.
        
    });
    })


app.get("/:customListName",(req,res)=>{     //custom get requests,to create new lists
    const customListName=_.capitalize(req.params.customListName);
    List.findOne({name:customListName},(err,foundList) => {
        if(!err){
            if(!foundList){
                const list=new List({
                    name:customListName,
                    items:defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                res.render("list",{listTitle:foundList.name,newItems:foundList.items});
            }
        }
    })
})


app.post("/",(req,res)=>{
    const listName=req.body.list;
    const item=new Item({
        name:req.body.newItem
    });
    if(listName==="Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name:listName},(err,foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        })
    }
})

app.get("/about", function(req, res){
    res.render("about");
  });

app.post("/delete",(req,res)=>{
    const checkedItemId=req.body.checkbox;
    const listName=req.body.listName;
    if(listName=="Today"){
        Item.findByIdAndRemove(checkedItemId,(err)=>{
            if(!err){
                console.log("Item Deleted successfully");
            }
        })
        res.redirect("/");
    } else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},(err,foundList)=>{        /*get the specific list. go into its items array and pull from it that entry whose id matches the checkedItemId*/
            if(!err){
                res.redirect("/"+listName);
            }
        })
    }
});

app.post("/newList",(req,res)=>{
    res.redirect("/"+req.body.newList);
})

app.listen(3000,()=>{
    console.log("Server started listening on port 3000");
})