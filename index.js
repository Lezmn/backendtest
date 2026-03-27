const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const app = express();
const core =equire('cors');
app.use(core());
const port = 8000;
app.use(bodyParser.json());r

 
let users = []
 
let conn = null
const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'webdb',
        port: 8830
    })
}


// path = GET /users สำหรับ get users ทั้งหมดที่บันทึกไว้
app.get('/users', async (req, res) => {
    const results = await conn.query('SELECT * FROM users')
    res.json(results[0]) 
})

app.get('/assets', async (req, res) => {
    const results = await conn.query(`SELECT assets.assets_id, assets.asname, 
        assets.serial_number, assets.asset_number, assets.price, assets.status, 
        assetStatus.status AS status_name
        FROM assets 
        LEFT JOIN assetStatus ON assets.status = assetStatus.status_id
        ORDER BY assets.assets_id ASC;`)

    res.json(results[0])
})

app.get('/borrow', async (req, res) => {
    const results = await conn.query(`SELECT borrowed.borrow_id, borrowed.bname, borrowed.date, 
        borrowed.signed, borrowed.reason, borrowed.bStatus, assets.asname AS item 
        FROM borrowed
        JOIN assets ON borrowed.assets_id = assets.assets_id;`)
    res.json(results[0])
})

app.get('/borow', async (req, res) => {
    const results = await conn.query(`SELECT borrowed.borrow_id, borrowed.bname, borrowed.date, 
        borrowed.signed, borrowed.reason, borrowed.bStatus, assets.asname AS item 
        FROM borrowed
        JOIN assets ON borrowed.assets_id = assets.assets_id
        LIMIT 10;`)
    res.json(results[0])
})
 
app.get('/status', async (req, res) => {
    const results = await conn.query('SELECT * FROM assetStatus')
    res.json(results[0])
})



// path = POST /users สำหรับสร้าง users ใหม่บันทึกเข้าไป
app.post('/assets', async (req, res) => {
   
    try{
        let asset = req.body;
        
        const results = await conn.query('INSERT INTO assets SET ?', asset)
        res.json({
            message: 'Create asset successfully',
            data: results[0]
        })
    }catch(error){
        const errorMessage = error.message || 'something went wrong'
        const errors = error.errors || []
        console.error('error: ', error.message)
        res.status(500).json({
            message: errorMessage,
            errors: errors,
        })
    }
})

app.post('/borrow', async (req, res) => {
   
    try{
        let data = req.body;
        
        const results = await conn.query('INSERT INTO borrowed SET ?', data)
        res.json({
            message: 'Create asset successfully',
            data: results[0]
        })
    }catch(error){
        const errorMessage = error.message || 'something went wrong'
        const errors = error.errors || []
        console.error('error: ', error.message)
        res.status(500).json({
            message: errorMessage,
            errors: errors,
        })
    }
})
 
// path = GET /users/:id สำหรับดึง users รายคนออกมา

    app.get('/assets/:id', async (req, res) => {
        try{
          let id = req.params.id;
          const results = await conn.query(`SELECT assets.assets_id, assets.asname, 
        assets.serial_number, assets.asset_number,assets.price, assets.status, assetStatus.status AS status_name
        FROM assets
        JOIN assetStatus ON assets.status = assetStatus.status_id
        WHERE assets.assets_id= ?
        ORDER BY assets.assets_id ASC`, id)
          if (results[0].length == 0) {
              throw {statusCode: 404, message: 'asset not found'}
          }
          res.json(results[0][0])
        
        }catch(err){
          console.error('error: ', err.message)
          let statusCode = err.statusCode || 500
          res.status(500).json({
              message: 'something went wrong',
              errorMessage: err.message
          })
        }
})

app.get('/assets/search/:name', async (req, res) => {
    try{
        let name = req.params.name;
      const results = await conn.query(`SELECT assets.assets_id, assets.asname, 
    assets.serial_number, assets.asset_number,assets.price, assets.status, assetStatus.status AS status_name
    FROM assets
    JOIN assetStatus ON assets.status = assetStatus.status_id
    WHERE assets.asname LIKE ?
    ORDER BY assets.assets_id ASC`, `%${name}%`)
      if (results[0].length == 0) {
          throw {statusCode: 404, message: 'asset not found'}
      }
      res.json(results[0])
    
    }catch(err){
      console.error('error: ', err.message)
      let statusCode = err.statusCode || 500
      res.status(500).json({
          message: 'something went wrong',
          errorMessage: err.message
      }) 
    }
})

app.get('/borrow/:id', async (req, res) => {
    try{
      let id = req.params.id;
      const results = await conn.query(`SELECT borrowed.borrow_id, borrowed.bname, borrowed.date,
        borrowed.signed, borrowed.reason, borrowed.bStatus, borrowed.assets_id, assets.asname AS asset_name
    FROM borrowed
    JOIN assets ON borrowed.assets_id = assets.assets_id
    WHERE borrowed.borrow_id= ? 
    ORDER BY borrowed.borrow_id ASC`, id)
      if (results[0].length == 0) {
          throw {statusCode: 404, message: 'asset not found'}
      }
      res.json(results[0][0])
    
    }catch(err){
      console.error('error: ', err.message)
      let statusCode = err.statusCode || 500
      res.status(500).json({
          message: 'something went wrong',
          errorMessage: err.message
      })
    }
})

 
 
//path: PUT /users/:id สำหรับแก้ไข users รายคน (ตาม id ที่บันทึกเข้าไป)
app.put('/assets/:id', async (req, res) => {
    try{
      let id = req.params.id;
      let updateAssets = req.body;
      const results = await conn.query('UPDATE assets SET ? WHERE assets_id = ?',[updateAssets,id])
      res.json({
          message: 'Update asset successfully',
          data: results[0]
      })
  }catch(error){
      console.error('error: ', error.message)
      res.status(500).json({
          message: 'something went wrong',
          errorMessage: error.message
      })
    }
})


app.put('/borrow/:id', async (req, res) => {
    try{
      let id = req.params.id;
      let updatedata = req.body;
      const results = await conn.query('UPDATE borrowed SET ? WHERE borrow_id = ?',[updatedata,id])
      res.json({
          message: 'Update data successfully',
          data: results[0]
      })
  }catch(error){
      console.error('error: ', error.message)
      res.status(500).json({
          message: 'something went wrong', 
          errorMessage: error.message
      })
    }
})
//path: DELETE /users/:id สำหรับลบ users รายคน (ตาม id ที่บันทึกเข้าไป)
app.delete('/assets/:id', async (req, res) => {
    try{
      let id = req.params.id;
      const results = await conn.query('DELETE FROM assets WHERE assets_id = ?', id)
      res.json({
          message: 'Delete assets successfully',
          data: results[0]
      })
    }catch(error){
      console.error('error: ', error.message)
      res.status(500).json({
          message: 'something went wrong',
          errorMessage: error.message
      })
    } 
})

app.delete('/borrow/:id', async (req, res) => {
    try{
      let id = req.params.id;
      const results = await conn.query('DELETE FROM borrowed WHERE borrow_id = ?', id)
      res.json({
          message: 'Delete borrowed successfully',
          data: results[0]
      })
    }catch(error){
      console.error('error: ', error.message)
      res.status(500).json({
          message: 'something went wrong', 
          errorMessage: error.message
      })
    } 
})

app.get("/getTable/:id", async (req, res) => {
    try {
        const tableId = req.params.id;
        let query = "";

        if (tableId == 1) {
            query = `SELECT assets.assets_id, assets.asname, 
        assets.serial_number, assets.asset_number, assets.price, assets.status, 
        assetStatus.status AS status_name
        FROM assets 
        LEFT JOIN assetStatus ON assets.status = assetStatus.status_id
        ORDER BY assets.assets_id ASC;`; // ตาราง 1
        } else if (tableId == 2) {
            query = `SELECT assets.assets_id, assets.asname, 
        assets.serial_number, assets.asset_number, assets.price, assets.status, 
        assetStatus.status AS status_name
        FROM assets
        LEFT JOIN assetStatus ON assets.status = assetStatus.status_id 
        WHERE assets.status = 1
        ORDER BY assets.assets_id ASC;`; // ตาราง 2
        } else if (tableId == 3) {
            query = `SELECT assets.assets_id, assets.asname, 
        assets.serial_number, assets.asset_number, assets.price, assets.status, 
        assetStatus.status AS status_name
        FROM assets
        LEFT JOIN assetStatus ON assets.status = assetStatus.status_id 
        WHERE assets.status = 2
        ORDER BY assets.assets_id ASC;`;
        } else if (tableId == 4) {
            query = `SELECT assets.assets_id, assets.asname, 
            assets.serial_number, assets.asset_number, assets.price, assets.status, 
            assetStatus.status AS status_name
            FROM assets
            LEFT JOIN assetStatus ON assets.status = assetStatus.status_id 
            WHERE assets.status = 3
            ORDER BY assets.assets_id ASC;`;
        } else if (tableId == 5) {
            query = `SELECT assets.assets_id, assets.asname, 
            assets.serial_number, assets.asset_number, assets.price, assets.status, 
            assetStatus.status AS status_name
            FROM assets
            LEFT JOIN assetStatus ON assets.status = assetStatus.status_id 
            WHERE assets.status = 4
            ORDER BY assets.assets_id ASC;`;
        }else return res.json([]);
        const [results] = await conn.query(query); 
        res.json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});




 
app.listen(port, async (req, res) => {
    await initMySQL()
    console.log('Http Server is running on port' + port)
});
 