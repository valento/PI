import express from 'express'
import path from 'path'
import jwt from 'jsonwebtoken'
import requestLanguage from 'express-request-language'
import authRouter from './routes/auth'
import userRouter from './routes/user'
import adminRouter from './routes/admin'
import productRouter from './routes/product'
import orderRouter from './routes/order'
import api from './api/'
import { getLan,orderListener,adminRouterHit } from './middleware/'

const start = options => {

  const { ENV,PORT,CURRENT_CITY } = options

  return new Promise( (resolve,reject) => {
    let app = express()

    app.use('/static', express.static(path.join(__dirname, '../client/build/static')) )
    app.use('/img', express.static(path.join(__dirname, '../client/build/img')) )
    if(ENV === 'production') app.use(express.static(path.join(__dirname, '../client/build')) )

    // == ROUTES & ROUTERS =====================================
    app.use('/auth', authRouter)
    app.use('/user', userRouter)
    app.use('/admin', (req,res,next) => {
      //req.mediator = mediator
      next()
    }, adminRouter)
    app.use('/products', productRouter)
    app.use('/orders', orderRouter)

    // ========================================================
// GET UI: Citiy list
    app.get('/ui', getLan, (req,res,next) => {
      let data = {}
      let params = {
        status: 1
      }
      const { lan } = req
    // SWITCH to:    req.language// === 'en' ? 'bg' : req.language
      //if(lng === 'lan') {
      //  data.lan = req.language==='es'? 'es' : 'bg'
      //} else {
      data.lan = lan
      if(!!CURRENT_CITY) data.city = Number(CURRENT_CITY)
      //}
    // get cities: ? add params {status: 4} if needed
      api.getList('city',['name','status','id','zone','code','alt'],params)
      .then( response => {//,{c_status: 4}
        const cty = response.map( entry => {
    //switch BG to req.language in production
          return {
            title: JSON.parse(entry.name)[data.lan],
            id: entry.id,
            //status: entry.c_status,
            alt: entry.alt ? JSON.parse(entry.alt)[data.lan] : NULL,
            status: entry.status
          }
        })
        data.cities = cty
        data.mob = req.get('user-agent').match((/(Mobile)/g)) ? true : false
        data.banner = !!(process.env.BANNER == 'true')
        res.status(200).json(data)
      })
      .catch( err => res.status(500).json({message: err}))
    })

    app.get('/*', (req,res) => {
      const {err} = req
      console.log('Root: ',ENV)
      if(ENV==='production'){
        console.log('Running: ',ENV)
        res.sendFile(path.join(__dirname, '../client/build/index.html'))
      } else if(!err) {
        res.send('This is not a Web Page! Check your routes...')
      } else {
        res.send(err.message)
      }
    })

    const server = app.listen(PORT, () => {
      console.log('Server Running on: ',PORT)
      resolve(server)
    })
    //resolve(server)
  })
}

export default Object.assign({},{ start })
