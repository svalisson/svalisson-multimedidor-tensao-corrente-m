const express = require('express')
const path = require('path')
const  initializeApp =  require("firebase/app");
const  getDatabase = require("firebase/database");
const PORT = process.env.PORT || 4300

const {  Client } = require('pg');
const http = require('http');

const app = express();
const server = http.createServer(app);

// test
const firebaseConfig = {
  apiKey: "AIzaSyAigFQ85uceRSjqC7hBL1ZlftNxWf0wWxo",
  authDomain: "multimedidor-tensao-corrente.firebaseapp.com",
  databaseURL: "https://multimedidor-tensao-corrente-default-rtdb.firebaseio.com",
  projectId: "multimedidor-tensao-corrente",
  storageBucket: "multimedidor-tensao-corrente.appspot.com",
  messagingSenderId: "942023989243",
  appId: "1:942023989243:web:723fac40e3f41065605d5e"
};

// Initialize Firebase
const datebase = initializeApp.initializeApp(firebaseConfig);
const db = getDatabase.getDatabase()

const config = {
  //clhostname : 'ec2-34-199-68-114.compute-1.amazonaws.com',
  host :  'ec2-44-194-4-127.compute-1.amazonaws.com',
  user: 'rnzsitjoavxdsi',
  database: 'dbgdiqt270ssd7',
  password: '082ca4bc3721a64672e28b8adc3375238d3b92b9295dd4faaf484e8901eed9ab',
  // host: 'localhost',
  // user: 'postgres',
  // password: '',
  // database : 'teste',
  port: 5432,              //Default port, change it if needed
  ssl: {
    rejectUnauthorized: false
  }
};

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')



let horario = '0';
let  sql = null;
let novoArray = null;
const starCountRef = getDatabase.ref(db, 'VariaveisMedidas');
let resPontencia = null;
let conta  = tensao = dateanterior =  diffDays = corrente = fatordepotencia = frequencia = potencia =  energia= ativo =null
getDatabase.onValue(starCountRef, async (snapshot) => {


  const data = snapshot.val();
  today=new Date();
  const h=today.getHours();
  const m=today.getMinutes();
  const s=today.getSeconds();
 
  const dateToday = new Date().toISOString()

  if(data.conta == 1 || horario <= 0){
    horario = h+" : "+m+ " : "+s;
  }

  const dataSplit = data.dados.split("@");  
  //console.log(dataSplit)
  if(dataSplit[0]){
     conta =  dataSplit[0].split(":");  
  }

  if(dataSplit[1]){
     voltagem =  dataSplit[1].split(":");  
  }


  if(dataSplit[2]){
     corrente =  dataSplit[2].split(":");  
  }

  if(dataSplit[3]){
     potencia =  dataSplit[3].split(":");  
  }

  if(dataSplit[4]){
     energia =  dataSplit[4].split(":");  
  }

  if(dataSplit[5]){
     frequencia =  dataSplit[5].split(":");  
  }

  if(dataSplit[6]){
     fatordepotencia =  dataSplit[6].split(":");  
  }

  if(dataSplit[7]){
    ativo =  dataSplit[7].split(":");  
 }

 console.log(data.dados)

  const client = await connectarClient(config)
  const res = await client.query('SELECT id, "created_at" FROM medida order by id desc limit 1');

let date1 = new Date();
if(res?.rowCount > 0){
  date1 = new Date(res.rows[0].created_at);
} 
 
 const date2 = new Date();
 const timeDiff = Math.abs(date2.getTime() - date1.getTime());
 diffDays = (ativo[1] == 1) ? Math.ceil(timeDiff / (1000 )) : 0; 
 
 const sql =`insert into medida (descricao,tensao,conta,corrente,fatordepotencia,frequencia,potencia,energia,intervalo) 
 values ('multi', ${voltagem[1] != ' nan' ? voltagem[1] :'0'}, ${conta[1]  != 'nan' ? conta[1] : '0'}
 ,${corrente[1] != 'nan' ? corrente[1] :'0'}, ${fatordepotencia[1] != 'nan' ? fatordepotencia[1] :'0'}, ${frequencia[1]  != 'nan' ? frequencia[1] : '0'}
 ,${potencia[1]  != 'nan' ? potencia[1] : '0'}, ${energia[1]  != 'nan' ? energia[1] : '0'}, ${diffDays})`
 
  
  client.query(sql, (err, res) => {
  console.log(err)
  
  })

});

async function connectarClient(config) {

  if (global.connection){
    return global.connection
  }  
  const client = new Client(config)

  
  //guardando para usar sempre o mesmo
  global.connection = client;
  await client.connect()
  return client;
    
  }

  
app.get('/', async (req, res) => {

  const mes = Array('janeiro',  'fevereiro', 'março', 'abril', 'maio','junho',
                'julho', 'agosto', 'setembro',  'outubro', 'novembro', 'dezembro');

  const client = await connectarClient(config)
  const start = await client.query('SELECT date(created_at) as datas, current_date as hoje FROM medida group by date(created_at) order by date(created_at)  asc  ')

  //console.log(start.rows)

  // const sql =`select 
  // ROUND( CAST( (((sum(cast(potencia as float8) * cast(intervalo as integer)))/3600)) AS numeric ),3) as hoje
  // from medida where date(created_at) = current_date  `

  const sql = `
  select 

  ROUND((CAST((select me.energia
  from medida me
   where date(me.created_at) = (current_date) 
  order by me.created_at desc
  limit 1) AS numeric)
  -
  CAST((select 
    mp.energia
    from medida mp
    where date(mp.created_at) = (current_date)  
    order by mp.created_at asc 
    limit 1)  AS numeric)),2) as hoje
  `

  const resultado_hoje = await client.query(sql)


  // const sql_mes =`select 
  // ROUND( CAST( (((sum(cast(potencia as float8) * cast(intervalo as integer)))/3600)/1000) AS numeric ),3) as mes
  // from medida where to_char(created_at, 'MM') = to_char(current_date, 'MM')  `

  const sql_mes = `
  select 

  ROUND((CAST((select me.energia
  from medida me
   where  to_char(created_at, 'MM') = to_char(current_date, 'MM') 
  order by me.created_at desc
  limit 1) AS numeric)
    -
  CAST((select 
    mp.energia
    from medida mp
    where to_char(created_at, 'MM') = to_char(current_date, 'MM') 
    order by mp.created_at asc 
    limit 1)  AS numeric)),2)  as mes
  `

  const resultado_mes = await client.query(sql_mes)


  // const sql_final =`select 
  // ROUND( CAST( (((sum(cast(potencia as float8) * cast(intervalo as integer)))/3600)/1000) AS numeric ),3) as tudo
  // from medida`

  const sql_final= `
  select 
  ROUND(CAST((select me.energia
  from medida me
  order by me.created_at desc
  limit 1) AS numeric),3) as tudo`

  const resultado_final = await client.query(sql_final)

  // /console.log(mes)
  res.render('pages/', { mesa : mes, data_current: start.rows , data_hoje : resultado_hoje.rows, data_mes : resultado_mes.rows, data_final : resultado_final.rows} );
});

app.get('/medida', async (req, res, next) => {

  //clearconsole.log(req)
  let query_param = req.query

  console.log(query_param)
  let dateCurrent = new Date().toISOString()
  let valor = 0;
  if(req.query.datainicio){
    dateinicio = req.query.datainicio
  }else{
    dateinicio = dateCurrent
  }

  if(req.query.datafim){
    datefim = req.query.datafim
  }else{
    datefim = dateCurrent
  }

  if(req.query.valor){
    valor = req.query.valor
  }

  const client = await connectarClient(config)
//   const sql =`select 
//   ROUND( CAST( (((sum(cast(potencia as float8) * cast(intervalo as integer)))/3600)/1000 * ${valor}) AS numeric ),2) as total,
// ROUND( CAST( (((sum(cast(potencia as float8) * cast(intervalo as integer)))/3600)/1000 ) AS numeric ),3) as base
// from medida where date(created_at) >= '${dateinicio}' and  date(created_at) <= '${datefim}'  `

  const sql = `  
  select ca.base , round(cast(ca.base * ${valor} as numeric),2) as total 
  from (
  select 

  ROUND((CAST((select me.energia
  from medida me
   where  date(me.created_at) = date('${datefim}')
  order by me.created_at desc
  limit 1) AS numeric)
    -
  CAST((select 
    mp.energia
    from medida mp
     where  date(mp.created_at) = date('${dateinicio}')
    order by mp.created_at asc 
    limit 1)  AS numeric)),2)  as base
) as ca`
  const start = await client.query(sql)
  console.log(sql)
 // console.log(start.rows)
  res.render('pages/medida', { dado: start.rows});
  
});
app.get('/profile', async (req, res, next) => {

  let dateCurrent = new Date().toISOString()
  if(req.query.date){
    dateCurrent = req.query.date
  }
  //console.log(dateCurrent)
  const client = await connectarClient(config)
  const sql = `
  select * from (                  
    select to_char(created_at ,'HH24:MI') as horario,potencia,  energia,intervalo, tensao,
    
      ROW_NUMBER () OVER (
                        PARTITION BY (to_char(created_at ,'HH24MI'))	
                       ORDER BY created_at asc 
                      ) as best
    
    from medida
    where intervalo is not null
    and  date(created_at) = date ('${dateCurrent}')
    and CAST(nullif(intervalo, '') AS integer) < 60
    and to_char(created_at ,'HH24MI') in(
    '0000',
    '0015',
    '0030',
    '0045',
    
    '0100',
    '0115',
    '0130',
    '0145',
      
    '0200',
    '0215',
    '0230',
    '0245',
    
    '0300',
    '0315',
    '0330',
    '0345',
      
    '0400',
    '0415',
    '0430',
    '0445',
      
    '0500',
    '0515',
    '0530',
    '0545',
      
    '0600',
    '0615',
    '0630',
    '0645',
      
    '0700',
    '0715',
    '0730',
    '0745',
      
    '0800',
    '0815',
    '0830',
    '0845',
      
    '0900',
    '0915',
    '0930',
    '0945',
      
    '1000',
    '1015',
    '1030',
    '1045',
      
    '1100',
    '1115',
    '1130',
    '1145',
      
    '1200',
    '1215',
    '1230',
    '1245',  
      
      
    '1300',
    '1315',
    '1330',
    '1345',
      
    '1400',
    '1415',
    '1430',
    '1445',  
     
        
    '1500',
    '1515',
    '1530',
    '1545',
      
    '1600',
    '1615',
    '1630',
    '1645',  
      
      
      
    '1700',
    '1715',
    '1730',
    '1745',
      
    '1800',
    '1815',
    '1830',
    '1845',  
      
      
      
    '1900',
    '1915',
    '1930',
    '1945',
      
    '2000',
    '2015',
    '2030',
    '2045',
      
      
    '2100',
    '2115',
    '2130',
    '2145',  
      
    '2200',
    '2215',
    '2230',
    '2245', 
      
      
    '2300',
    '2315',
    '2330',
    '2345'   
        
    ) ) as lista
    where lista.best = 1
     `
  //   console.log(sql)
  resPontencia = await client.query(sql)
  res.render('pages/grafico', { dado: resPontencia.rows});
})


app.get('/mes', async (req, res, next) => {

  let dateCurrent = 0
  if(req.query.date){
    dateCurrent = +req.query.date
  }
  //console.log(dateCurrent)
  const client = await connectarClient(config)
  const sql = `
SELECT concat(extract(day from created_at), '@', extract(month from created_at)) as "dia", 
       round(max(cast(energia as numeric)), 2) as energia,
       round(avg(cast(tensao as numeric)), 2) as tensao
FROM public.medida
WHERE extract(month from created_at) = '${dateCurrent+1}' 
OR(
extract(month from created_at) = '${dateCurrent+1}'+1 and extract(DAY from created_at) = 1 
)
GROUP BY concat(extract(day from created_at), '@', extract(month from created_at))
order by energia;
 `
  // console.log(sql)
  resPontencia = await client.query(sql)
  res.render('pages/grafico_mes', { dado: resPontencia.rows});
})
server.listen(PORT, () => {
  console.log(`listening on *: ${ PORT }`);
});
