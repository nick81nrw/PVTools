export const state = () => ({
  plants: [],
  customers: [],
  tickets: [],
  devices: [],
  tenants: [],
})

export const getters = {
  plants: (state) => {
    return state.plants
  },
  plantsById: (state) => (id) => {
    return state.plants.find((plant) => plant.id === id)
  },
  customers: (state) => {
    return state.customers
  },
  tickets: (state) => {
    return state.tickets
  },
  devices: (state) => {
    return state.devices
  },
  tenants: (state) => {
    return state.tenants
  },
}

export const mutations = {
  /** Update State with new Data */
  setPlantItems(state, items) {
    state.plants = items
  },
  setCustomerItems(state, items) {
    state.customers = items
  },
  setTicketItems(state, items) {
    state.tickets = items
  },
  setDeviceItems(state, items) {
    state.devices = items
  },
  setTenantItems(state, items) {
    state.tenants = items
  },
  /** */
  updatePlant() {},
}

export const actions = {
  async syncData({ commit }) {
    commit('setPlantItems', (await this.$axios.get(`/plants`)).data)
    commit('setCustomerItems', (await this.$axios.get(`/customers`)).data)
    commit('setTicketItems', (await this.$axios.get(`/tickets`)).data)
    commit('setDeviceItems', (await this.$axios.get(`/devices`)).data)
    commit('setTenantItems', (await this.$axios.get(`/tenants`)).data)
  },
  updateResource({ dispatch, commit }, payload) {
    return new Promise((resolve, reject) => {
      dispatch('misc/requestSend', null, { root: true })
      if (payload.data.id) {
        this.$axios
          .put(`/${payload.resource}/${payload.data.id}`, payload.data)
          .catch((error) => reject(error))
          .then((response) => {
            dispatch('misc/replyReceived', { success: true }, { root: true })
            dispatch('syncData')
            console.log(response.data)
            resolve(response.data)
          })
      } else {
        this.$axios
          .post(`/${payload.resource}`, payload.data)
          .catch((error) => reject(error))
          .then((response) => {
            dispatch('misc/replyReceived', { success: true }, { root: true })
            dispatch('syncData')
            console.log(response.data)
            resolve(response.data)
          })
      }
    })
  },
  deleteResource({ dispatch }, payload) {
    dispatch('misc/requestSend', null, { root: true })
    return new Promise((resolve, reject) => {
      this.$axios
        .delete(`/${payload.resource}/${payload.data.id}`)
        .catch((error) => reject(error))
        .then((response) => {
          dispatch('misc/replyReceived', { success: true }, { root: true })
          dispatch(
            'misc/makeToast',
            { type: 'delete', variant: 'success' },
            { root: true },
          )
          dispatch('syncData')
          resolve(response.data)
        })
    })
  },
}
