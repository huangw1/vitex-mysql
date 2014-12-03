var Vitex = require('../');
var db = {
	host: 'localhost',
	user: 'root',
	password :'',
	database:"test"
};

var v = Vitex('test',db);
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
v.find(function(err,result){
	console.log(result);
});

console.log(v.getSql());