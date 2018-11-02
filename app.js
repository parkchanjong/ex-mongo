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
function connectDB() {
    //데이터베이스 연결정보
    var databaseUrl = 'mongodb://localhost:27017/local';

    //데이터베이스 연결
    MongoClient.connect(databaseUrl,function(err, db) {
        if (err) throw err;

        console.log('디비에 연결: '+ databaseUrl);

        //database 변수에 할당
        database = db;
    });
}


//사용자 인증 함수
var authUser = function(database, id, password , callback) {
    console.log('authUser 호출됨');

    //users 컬렉션 참조
    var users = database.collection('users');

    //아이디와 비밀번호사용해 검색
    users.find({ "id" : id, "password" : password}).toArrary(function(err,docs) {
        if(err) {
            callback(err,null);
            return;
        }

        if(docs.lenght > 0) {
            console.log('아이디  [%s], 비밀번호 [%s]가 일치하는 사용자 찾음',id,password);
            callback(null,docs);
        }
        else {
            console.log('일치하는 사용자 못찾음')
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