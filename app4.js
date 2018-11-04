//익스프레스 기본모듈
var express =require('express')
    ,http = require('http')
    ,path = require('path')

//익스프레스 미들웨어
var bodyParser = require('body-parser')
    ,cookieParser = require('cookie-Parser')
    ,static = require('serve-static')
    ,errorHandler = require('errorhandler')

//오류핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler')

//세션 미들웨어
var expressSession = require('express-session')

  //mongoose 모듈 불러들이기

  var mongoose = require('mongoose');

//익스프레스 객체 생성
var app =express();

//기본 속성 설정
app.set('port',process.env.PORT || 3000);

//바디파서를 사용해     앱/ 유알엘   파싱
app.use(bodyParser.urlencoded({ extended: false }));

//바디파서로  앱/제이슨 파싱
app.use(bodyParser.json());

//퍼블릭 폴러를 스태틱으로 오픈
app.use('/public',static(path.join(__dirname,'public')));

//쿠키파서 설정
app.use(cookieParser());

//세션 설정
app.use(expressSession({
    secret:'mykey',
    resave:true,
    saveUninitialized:true
}));

//라우터 객체 참조
var router = express.Router();

//로그인 라우팅 함수 -데이터베이스의 정보와 비교함
router.route('/process/login').post(function(req,res){
    console.log('//process/login 호출됨');
});

//라우터 객체 등록
app.use('/',router);

//404 페이지
var errorHandler =expressErrorHandler({
    static: {
        '404': './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//서버시작
http.createServer(app).listen(app.get('port'),function() {
    console.log('서버시작 포트: '+app.get('port'));
    //디비 연결
    connectDB();
});

//몽고디비 모듈 사용
var MongoClient = require('mongodb').MongoClient;

//데이터베이스 객체 변수
var database;

//디비에 연결
//데이터베이스 객체를 위한 변수 선언
var database;

//데이터베이스 스키마 객체를 위한 변수 선언
var UserSchema;

//데이터 베이스 모델 객체를 위한 변수 선언
var UserModel;

//데이터 베이스에 연결
function connectDB() {
  //데이터베이스 연결 정보
  var databaseUrl = 'mongodb://localhost:27017/local';

  //데이터 베이스 연결
  console.log('데이터베이스 연결 시도');
  mongoose.Promise =global.Promise;
  mongoose.connect(databaseUrl);
  database = mongoose.connection;

  database.on('err',console.error.bind(console,'mongoose connection error.'));
  database.on('open', function() {
      console.log('데이터 베이스에 연결됨 : ' + databaseUrl);

      //스키마 정의
      UserSchema = mongoose.Schema({
          id:{type :  String,require : true, unique:true},
          password:{ type : String, require : true},
          name:{type : String, index : 'hashed'},
          age : {type : Number, 'default': -1},
          created_at : {type : Date, index : {unique : false}, 'default': Date.now},
          updated_at : {type : Date, index : {unique : false}, 'default': Date.now}
      });

      //스키마에 staic메소드 추가
      UserSchema.static('findById',function(id,callback) {
          return this.find({id:id}, callback);
      });

      UserSchema.static('findAll',function(callback) {
          return this.find({ },callback);
      });

      console.log('유저스키마 정의함');

      //UserModel 모델 정의
      UserModel = mongoose.model("users2", UserSchema)
      console.log('유저 모델 정의함');
  });

  //연결 끊겼을때 5초후 재연결
  database.on('disconnected',function() {
      console.log('연결 끊김 5초후 다시 연결');
      setInterval(connectDB,5000);
  });
}




//사용자 인증함수 : 아이디로 먼저 찾고  비밀번호 비교
var authUser = function(database,id,password,callback) {
    console.log('authUser 호출됨 :');

    //아이디와 비밀번호를 사용해 검색
    UserModel.find(id,  function(err, results) {
        if(err) {
            callback(err, null);
            return;
        }

        console.log('아이디 [%s] 로 사용자 검색 결과',id);
        console.dir(results);

        if(results.lenght > 0) {
            console.log ('일치하는사람 찾음',id);
            
            //2 비밀번호 확인
            if(results[0]._doc.password == password) {
                console.log ('비밀번호 일치함'); 
                callback(null,results);
            }
            else {
                console.log('비밀번호 일치하지 않음')
                callback(null,null);
            }
        } else {
            console.log('아이디와 일치하는 사용자 못찾음')
            callback(null,null);
        }
    });
}


app.post('/process/login', function(req,res) {
    console.log('/process/login 호출됨');
    
    var paramId = req.param('id');
    var paramPassword = req.param('password');


if(database) {
    authUser(database,paramId,paramPassword,function(err,docs) {
        if(err) {throw err;}

        if(docs) {
            console.dir(docs);
            var username=docs[0], name;
            res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
            res.write('<h1>로그인 성공</h1>');
            res.write('<div><p>사용자 아이디 : '+paramId+'</p></div>');
            res.write('<div><p>사용자 이름 : '+paramname+'</p></div>');
            res.write("<br><br><a href='public/login.html'>다시 로그인하기</a>");
            res.end();
        }
    });
} else {
    res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
    res.write('<h2>데이터베이스 연결안됨</h2>');
    res.write('<div><p>데이터베이스 연결 안됨요!</p></div>');
    res.end();
}
});


//-----------------------------------

//사용자 추가,등록 함수
var addUser = function(database,id,password,name,callback) {
    console.log('addUser 호출됨 :'+ id +','+password);

    //userModel 의 인스턴스 생성
    var user = new UserModel({"id":id,"password":password,"name":name});
    
    //save()로 저장
    user.save(function(err) {
        if(err){
        callback(err,null);
        return;
    }
        console.log("사용자 데이터 추가함");
        callback(null,user);
    });
};



// 사용자 추가 라우팅 함수- 클라이언트에서 보내온 데이터를 이용해 데이터베이스 추가
router.route('/process/adduser').post(function(req,res) {
    console.log('/process/adduser 호출됨');

    var parmId =req.body.id || req.query.id;
    var parmPassword =req.body.password || req.query.password;
    var parmName =req.body.name || req.query.name;

    console.log('요청 파라 미터 : ' + parmId + ','+ parmPassword + ',' + parmName);

    //데이터베이스 객체가 초기화된 경우, adduser 함수 호출하여 사용자 추가
    if (database) {
        addUser(database,parmId,parmPassword,parmName,function(err,result) {
            if (err) {throw err;}

            //결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
            if (result && result.insertedCount > 0) {
                console.dir(result);
                
                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 추가 실패</h2>');
                res.end();
            }
        });
    } else {//데이터베이스 객체가 초기화 되지 않은 경우 실패 응답 전송
        res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
});
  //-------------------------------------------------------

// 사용자 리스트 함수
router.route('/process/listuser').post(function(req,res) {
    console.log('/process/listuser 호출됨');

    //데이터 베이스 객체가 초기화된 경우, 모델객체의 findAll메소드 호출
    if (database) {
        //모든 사용자 검색
        UserModel.findAll(function(err,results){
            if (err) {
                console.error('사용자 리스트 조회중 오류 발생 :' + err.stack);

                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 리스트 조회 중 오류 발생</h2>');
                res.write('<p>+ err.stack +</p>');
                res.end();
                
                return;
            }

            if (results) {
                console.dir(result);
                
                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 리스트</h2>');
                res.write('<div><ul>');

                for(var i = 0; i< results.lenghl;i++) {
                    var curId = results[i]._doc.id;
                    var curName = results[i]._doc.name;
                    res.write(' <li>#' +i+ ':' +curId + ',' +curName+ '</li>');
                }

                res.write('</ul></div>');
                res.end();
            } else { //결과 객체가 없으면 실패 응답 전송
                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 리스트 조회 실패</h2>');
                res.end();
            }
        });
    } else{ //데이터베이스 객체가 초기화 되지 않았을 때 실패 응답 전송
        res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
});
            

  




