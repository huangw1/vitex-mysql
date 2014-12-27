var Vitex = require('../');
var db = {
	host: 'localhost',
	user: 'root',
	password :'',
	database:"test"
};

var v = Vitex('test x',db);

v.save([{name:"tets node5"},{name:"test node6"}]);
v.save([['name'],['xxx'],['setme']],function(err,re){
	console.log(re);
});
v.like('name',"node5").limit(5).find(function(err,result){
	console.log(result);
});
v.count(function(err,num){
	console.log(num);
});
// >= > <= < != 
v.where("name!=","setmexxx");
/*
//join test
v.select("n.*,x.name")
v.join("name n","x.nid = n.id");
*/
// According to the set step increase
/*
v.step('name',function(err,result){
	console.log(err);
	console.log(result);
});
v.step('name',5,function(err,result){
	console.log(err);
	console.log(result);
});*/
v.find(function(err,result){
	console.log(result);
});

console.log(v.getSql());