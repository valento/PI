import api from '../../api/admin'

export const addLocation = (data,type) => dispatch => {
  console.log('Add location: ',data,type)
  return api.locations.addLocation(data,type).then( res => res )
}

export const getList = type => dispatch => {
  return api.getList(type).then()
}
