import jwt from 'jsonwebtoken'


let mediator

export const getUser = (req,res,next) => {
  const token = req.get('Authorization')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('/user API-decoded: ',decoded)
    req.email = decoded.email
    req.uid = decoded.uid
    req.member = decoded.member
    next()
  } catch(err) {
    return res.status(401).json({ error: { message: 'Invalid token' }})
  }
  //next()
}

export const getLan = (req,res,next) => {
  req.lan = req.get('Accepted-Language') !== undefined ? req.get('Accepted-Language') : 'bg'
  console.log('Accepted-Language: ', req.lan)
  next()
}

export const getUserId = (req,res,next) => {
  const token = req.get('Authorization')
  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log('/user API-decoded: ',decoded)
    req.uid = decoded.uid
    req.member = decoded.member
  } catch(err) {
    return res.status(401).json({ error: { message: 'Invalid token' }})
  }
  next()
}

export const checkAdmin = (req,res,next) => {
  const token = req.get('Authorization')
  jwt.verify(token, process.env.JWT_SECRET, (err,decoded) => {
    if(!err && decoded.email === 'valentin.mundrov@gmail.com') {
      req.id = decoded.uid
      next()
    } else {
      return res.status(401).json({ error: { message: 'Unauthorized User!' }})
    }
  })
}
