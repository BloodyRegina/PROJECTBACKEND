exports.get = (req,res) =>{
    res.send("Get customers");
}

exports.getById = (req,res) =>{
    res.send("Customer ID: " + req.params.id);
}

exports.getname = (req,res) =>{
    res.send("Customer Name:" + req.params.name);
}
exports.post = (req,res) =>{
    res.send("New customer ");
}

exports.put = (req,res) =>{
    res.send("Edit customer id: " + req.params.id );
}

exports.patch = (req,res) =>{
    res.send("Patch customer id: " + req.params.id );
}

exports.delete = (req,res) =>{
    res.send("Delete customer id: " + req.params.id);
}