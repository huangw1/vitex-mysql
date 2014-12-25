vitex-mysql
===========

这是一个对node-mysql的封装，可以让您更简单的更快捷的开发程序。

# INSTALL
	
	npm install vitex-mysql

#Sample
	var db = {
		host: 'localhost',
		user: 'root',
		password :'',
		database:"test"
	};
	var Vitex = require('vitex-mysql');  
	var model = Vitex('table',db);  
	model.where("_id",id).find(function(err,docs){  
	    console.log(docs);  
	})
	
	 model.save({name:1,pass:"123456"},function(err,result){
		console.log(result);
	})

# SETTING

	host: 主机
	user: 用户名
	password 密码
	database 数据库
	charset 编码 (Default: 'UTF8_GENERAL_CI')
	[more](https://github.com/felixge/node-mysql#connection-options)

# API
## Method  
### endureTable  
	@param string  
	设置默认表名，保留表 与构造时传递的第一个字符串参数作用一致  
	model.endureTable('col');

### from  
	@param string  
	设置要查询的表名，此设置会优先于endureTable方法  
    model.from('user');

### where  
	@param object/string  
	设置查询的条件  
	model.where("_id",id)  
	model.where({_id:id})
	model.where("_id!=",id) //>= > <= < != 都可以写在 id中
	此功能主要为了简化 不等于大于等于这样的复杂操作
### like
	@param key string 字段
	@param val string 如果没有 %则会自动添加  %val%
	模糊查询，


### select  
	@param string/array  
	要查询的字段    
	model.select("id")  
	model.select(["id"])  

### limit  
	@param int  条数
	@param int  偏移跳过的条数 默认0
	查询条数和偏移skip  
	model.limit(15,10)  

### sort  
	@param string/array  string =>field  array=>   ["id desc","name asc"]
	@param string  asc/desc (default: desc)
	排序字段设置  
	model.sort(field,val)  
### set
	@param string/object  
	@param string/object  
	设置update时修改的字段  
	eg:    
	vitex.set('username',"skipify")  
	vitex.set({username:"skipify","password":"123456"});
### join
	@param table 表名
	@param cond 条件
	vitex.join("test t","t.nid = b.id");
### find
	@param function 回调函数
	查询信息
	** 这里有一个注意事件，如果调用了where方法，然后调用 find方法，那么查询条件将会缓存下来供给count方法直接无条件调用 **
	model.find(function(err,docs){
		console.log(docs);
	})
	
### count  
	@param function 回调函数
	按照条件查询符合条件的数目 注意find方法的说明
	model.count(function(err,num){
		console.log(num);
	})

### findOne
	同find,此方法返回的 doc是单条信息 会自动添加 limit 1

### remove
	@param object/function 删除信息的配置项/回调函数 返回影响的行数
	@param function 回调
	
	删除信息
	model.remove(function(err,result){

	})



### save
	@param object/array 要保存的对象记录
	@param object/function 配置项/回调函数
	@param function 回调函数
	model.save({a:1},function(err,result){
		
	})

### update
	@param object 要保存的对象记录
	@param object/function 配置项/回调函数，配置项参考mongodb-native接口
	@param function 回调函数
	model.update({a:1},function(err,result){
	})


### page
	@param int 页数
	@param int 每页条数
	@param function 回调函数 {total:num,data:docs}
	
	一个组合类的方法，此方法用于查询分页的快捷方式，注意返回的数据信息中包含符合条件的总条数
	model.page(2,20,function(err,data){
		console.log("num："+data.total);
		console.log(data.data);
	})

### close
	关闭连接
	model.close();
### exec
	执行sql
	model.exec("select * from test",function(err,result){});
# 原生接口
	
	model.connection ;