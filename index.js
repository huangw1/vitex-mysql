var mysql = require('mysql'),
	_     = require('lodash');


var connection,
	sql;
var db = {
	host: 'localhost',
	user: 'root',
	password :'',
	database:"test"
};

var Vitex = function(dc,obj){
	if(!(this instanceof Vitex)) return new Vitex(dc,obj);
	this._dc = dc;
	if(_.isEmpty(obj))
	{
		throw new Error('Connect String Empty');
	}
	this.countConfig  = {};//方便find之后使用count查询，会缓存一次查询条件
	this._config = {
		table:'',
		where:{},
		fields:{},
		limit:0,
		skip:0,
		sort:[]
	};
	this.connect(obj);
}

//创建连接

Vitex.prototype.connect = function(setting){
	connection = mysql.createConnection(setting);
	connection.connect();
	return connection;
}

/*
	输出查询配置信息
 */
Vitex.prototype.test = function(){
	console.log(this._config);
	return this;
}


/*
	设置当前模型永不过期的集合名称
	此方法设置的集合名称不会因为查询而被清除
 */
Vitex.prototype.endureTable = function( c ){
	this._dc = c;
	return this;
}
/*
	重置参数
*/
Vitex.prototype.resetConfig = function(){
	var def = {
		table : "",
		where : {},
		fields : {},
		limit : 0,
		skip : 0,
		sort : []
	};
	for(var i in def)
	{
		this._config[i] = def[i]
	}
	if(this._dc){
		this._config.table = this._dc;
	}
	return this;
}

/*
	设置查询条件
*/
Vitex.prototype.where = function(k,v){

	if(_.isObject(k)){
		for(var i in k){
			var key = connection.escapeId(i);
			this._config.where[key] = connection.escape(k[i]);
		}
	}else{
		k = connection.escapeId(k);
		this._config.where[k] = connection.escape(v);
	}
	return this;
}
/*
	模糊查询
	@param string
	@param string/regexp
*/
Vitex.prototype.like = function(key,val){

}
/*
	选择集合
*/
Vitex.prototype.from = function(table){
	this._config.table = table;
	return this;
}
/*
	查询的字段
	field string/array
				 _id
				 [name,email]
*/
Vitex.prototype.select = function(field){
	var _fields = [];
	if(_.isArray(field)){
		_fields = _.union(this._config.fields,field);
	}else{
		_fields.push(field);
	}
	this._config.fields = _fields;
	return this;
}
/*
	限制条数
	limit 限制条数
	skip  跳过的条数
*/
Vitex.prototype.limit = function(limit,skip){
	this._config.skip = (skip === undefined ? 0 : skip);
	this._config.limit = (limit == undefined ? 0 : limit);
	return this; 
}

/*
	排序
	obj 排序字段
	sort("id","desc");
	sort(["id desc",[name asc]])
	sort(["id desc,name asc"]);

*/
Vitex.prototype.sort = function(obj,v){
	v = v || 'DESC';

	if(_.isArray(obj))
	{
		this._config.sort = _.union(this._config.sort,obj);
	}else{
		v   = v.toUpperCase();
		obj = connection.escapeId(obj);
		this._config.sort.push(obj + " " + v);
	}
	return this;
}
/*
	设置要修改的字段
 */
Vitex.prototype.set = function(k,v){
	if(_.isObject(k)){
		for(var i in k){
			this._config.set[i] = k[i];
		}
	}else{
		this._config.set[k] = v;
	}
	return this;
}

Vitex.prototype.buildSql = function(){
	var _sql = 'SELECT ',
		config = this._config,
		table  = config.table ? config.table : this._dc;
		if(!table){
			throw new Error('Table is Empty');
		}
		_sql += config.fields.length > 0 ? config.fields.join(',') : "*";
		_sql += " FROM " + table;

		//where
		if(config.where){
			_sql += " WHERE ";
			var _w = [];
			for(var k in config.where){
				_w.push(k+"="+config.where[k]+"");
			}
			_sql += _w.join(" AND ");
		}
		//order
		if(config.sort.length > 0)
		{
			_sql += " ORDER BY " + config.sort.join(',');
		}
		config.skip = config.skip || 0;
		if(config.limit){
			_sql += " LIMIT "+config.skip + "," + config.limit;
		}
		sql = _sql;
	return _sql;
}

//获取组成的查询SQL
Vitex.prototype.getSql = function(){
	return sql;
}

Vitex.prototype.find = function(callback){
	var sql = this.buildSql();
	if(!sql){
		throw new Error('Sql is Empty');
	}
	this.countConfig = this._config;
	connection.query(sql,function(err,rows,fields){
		callback && callback.apply(null,arguments);
	});
	this.resetConfig();
}

/*
	doc string/object
	{name:"this is a name"}
	
	[{name:'name1'},{name:"name2"}]

	[['name'],['name1'],['name2']] first element is keys
 */

Vitex.prototype.save = function(doc,callback){
	doc = doc || this._config.set;
	if(_.isEmpty(doc)){
		throw new Error('Insert Data Is Empty');
	}
	var table = this._config.table || this._dc;
	if(!table){
		throw new Error('Table Name is Empty');
	}
	if(_.isArray(doc))
	{
		if(doc.length == 0){
			throw new Error('Doc is Empty');
		}
		//two cases
		if(_.isArray(doc[0])){
			//one element is keys
			var keys = doc.shift();
			if(doc.length == 0){
				//没有要插入的内容
				throw new Error('Doc is Empty,Only has Keys');
			}
		}else{
			// keys are the object's keys
			var keys = [],vals = [];
			for(var i in doc){
				keys = _.keys(doc[i]);
				vals.push(_.values(doc[i]));
			}
			//过滤键值和内容
			doc = vals;
		}
		//filter keys
		for(var i in keys){
			keys[i] = connection.escapeId(keys);
		}
		keys = keys.join(',');

		var sql = "INSERT INTO Test ("+keys+") VALUES ?";
		connection.query(sql, [doc], function(err,result) {
		    callback && callback.apply(null,arguments);
		});
	}else{
		//单条信息插入
		connection.query("INSERT INTO ?? SET ?",[table,doc],function(err,result){
			callback && callback.apply(null,arguments);
		})
	}

}


//module.exports = Vitex;
var v = Vitex('test',db);
//v.save([{name:"tets node5"},{name:"test node6'"}]);
//v.save([['name'],['xxx'],['setme']]);

v.where('name','Ninja').sort('id','asc').limit(1).find(function(e,r){
	console.log(r);
});

console.log(v.getSql());