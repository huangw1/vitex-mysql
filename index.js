var mysql = require('mysql'),
	_     = require('lodash');


var connection,
	sql;
var Vitex = function(dc,obj){
	if(!(this instanceof Vitex)) return new Vitex(dc,obj);
	if(typeof dc === 'object'){
		obj = dc;
		dc  = '';
	}
	if(_.isEmpty(obj))
	{
		throw new Error('Connect String Empty');
	}
	this.countConfig  = {};//方便find之后使用count查询，会缓存一次查询条件
	this._config = {
		table:'',
		where:{},
		whereStr:'',
		like :{},
		fields:{},
		limit:0,
		skip:0,
		sort:[]
	};
	this.connect(obj);
	this._dc = dc ? connection.escapeId(dc) : '';
}

//创建连接

Vitex.prototype.connect = function(setting){
	connection = mysql.createConnection(setting);
	connection.connect();
	this.connection = connection;
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
		whereStr:'',
		like:{},
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
	k string && v undefined 可以指定一个特别的字符串条件
*/
Vitex.prototype.where = function(k,v){

	if(typeof k === 'string' && v === undefined){
		this._config.whereStr = k;
		return this;
	}
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
Vitex.prototype.like = function(k,v){
	if(_.isObject(k)){
		for(var i in k){
			var key = connection.escapeId(i);
			if(k[i].indexOf('%') ==-1){
				k[i] = '%' + k[i] + '%';
			}
			this._config.like[key] = connection.escape(k[i]);
		}
	}else{
		k = connection.escapeId(k);
		if(v.indexOf('%') ==-1){
			v = '%' + v + '%';
		}
		this._config.like[k] = connection.escape(v);
	}
	return this;
}
/*
	选择集合
*/
Vitex.prototype.from = function(table){
	this._config.table = connection.escapeId(table);
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

Vitex.prototype.buildSql = function(type){
	var _sql   = 'SELECT ',
		type   = type || 'select',
		config = this._config;
		if(type === 'count'){
			table  = config.table ? config.table : this.countConfig.table;
		}else{
			table  = config.table ? config.table : this._dc;
		}
	if(!table){
		throw new Error('Table is Empty');
	}
	switch(type){
		case "select":
			_sql = "SELECT ";
			_sql += config.fields.length > 0 ? config.fields.join(',') : "*";
			_sql += " FROM " + table;
		break;
		case "count":
			_sql = "SELECT COUNT(*) AS num FROM " + table;
			//处理上次保存的内容
			//此处非深度复制
			config.where    = _.isEmpty(config.where) ? this.countConfig.where : config.where;
			config.whereStr = config.whereStr || this.countConfig.whereStr;
			config.like     = _.isEmpty(config.like) ? this.countConfig.like : config.like;
			config.sort     = [];
			config.limit    = 0;
		break;
		case "remove":
			_sql = "DELETE FROM " + table;
		break;
		case "update":
			_sql = "UPDATE " + table + " SET ? ";
		break;
	}


	//where
	if(!_.isEmpty(config.where)){
		_sql += " WHERE ";
		var _w = [];
		for(var k in config.where){
			_w.push(k+"="+config.where[k]+"");
		}
		_sql += _w.join(" AND ");
		var haswhere = true;
	}
	if(config.whereStr){
		if(!haswhere){
			_sql += " WHERE 1 ";
		}
		_sql += " AND " + config.whereStr;
		haswhere = true;
	}
	if(!_.isEmpty(config.like)){
		if(!haswhere){
			_sql += " WHERE 1 ";
		}
		var _w = [];
		for(var k in config.like){
			_w.push(k+" like "+config.like[k]+"");
		}
		_sql += " AND " + _w.join(" AND ");
	}

	//order
	if(config.sort.length > 0)
	{
		_sql += " ORDER BY " + config.sort.join(',');
	}
	config.skip = config.skip || 0;
	if(config.limit){
		_sql += " LIMIT ";
		if(config.skip){
			_sql += config.skip + ",";
		}
		_sql += config.limit;
	}
	sql = _sql;
	return _sql;
}

//获取组成的查询SQL
Vitex.prototype.getSql = function(){
	return sql;
}

Vitex.prototype.find = function(callback){
	var sql = this.buildSql('select');
	if(!sql){
		throw new Error('Sql is Empty');
	}
	this.countConfig = {where:this._config.where,whereStr:this._config.whereStr,like:this._config.like,table:this._config.table};
	connection.query(sql,function(err,rows,fields){
		callback && callback.apply(null,arguments);
	});
	this.resetConfig();
}

Vitex.prototype.findOne = function(callback)
{
	this.limit(1);
	var sql = this.buildSql();
	if(!sql){
		throw new Error('Sql is Empty');
	}
	this.countConfig = {where:this._config.where,whereStr:this._config.whereStr,like:this._config.like,table:this._config.table};
	connection.query(sql,function(err,rows,fields){
		var row = rows.shift();
		callback && callback.call(null,err,row,fields);
	});
	this.resetConfig();
}

Vitex.prototype.count = function(callback){
	var  _sql = this.buildSql('count');
	connection.query(_sql,function(err,result,fields){
		var num = 0;
		if(!err && result.length > 0){
			num = result[0].num;
		}
		callback && callback.call(null,err,num);
	});
	this.countConfig = {};
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

		var _sql = "INSERT INTO Test ("+keys+") VALUES ?";
			_sql = mysql.format(_sql,[doc]);
			sql  = _sql;
		connection.query(_sql, function(err,result) {
		    callback && callback.call(null,err,result.insertId);
		});
	}else{
		//单条信息插入
		var _sql = "INSERT INTO ?? SET ?";
			_sql = mysql.format(_sql,[table,doc]);
			sql  = _sql;//导出sql语句
		connection.query("INSERT INTO ?? SET ?",[table,doc],function(err,result){
			callback && callback.call(null,err,result.insertId);
		})
	}

}
/*
	移除信息
 */
Vitex.prototype.remove = function(callback){
	var _sql = this.buildSql('remove');
	connection.query(_sql,function(err,result,fields){
		callback && callback.apply(null,err,result.effectedRows);
	})
}

/*
	编辑信息
	{name:'xxx'}
 */
Vitex.prototype.update = function(doc,callback){
	doc = doc || this._config.set;
	if(_.isEmpty(doc)){
		throw new Error('Update Data Is Empty');
	}
	var table = this._config.table || this._dc;
	if(!table){
		throw new Error('Table Name is Empty');
	}
	var _sql = this.buildSql('update');
		_sql = mysql.format(_sql,[doc]);
		sql  = _sql;
	connection.query(_sql,function(err,result){
		callback && callback.call(null,err,result.effectedRows);
	});
}
/*
	步增
*/
Vitex.prototype.step = function(field,step,callback){
	if(typeof step === 'function'){
		callback = step;
		step     = null;
	}
	step = step || 1;
	
}
/*
	根据页数获取列表
 */
Vitex.prototype.page = function(page,per,callback){
	if(typeof page === 'function'){
		callback = page;
		page = 1;
		per  = 10;
	}
	if(typeof per === 'function'){
		callback = per;
		per      = 10;
	}
	page = page || 1;
	per  = per  || 10;
	var that = this,
		start = (page - 1) * per,
		start = start >0 ? start : 0;
	this.limit(per,start).find(function(err,rows){
		if(err){
			callback && callback.apply(null,arguments);
			return ;
		}
		that.count(function(e,num){
			callback && callback.call(null,e,{total:num,data:rows});
		});
	});
}
//根据ID查询
Vitex.prototype.findById(id,callback){
	this.where('id',id).limit(1).find(callback)
}
//根据ID删除信息
Vitex.prototype.removeById(id,callback){
	this.where('id',id).limit(1).remive(callback);
}

Vitex.prototype.close = function(){
	connection.end();
}

module.exports = Vitex;