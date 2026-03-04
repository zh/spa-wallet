const ServerSelector = ({ servers, serverConfig, onServerChange, onConnect, connecting }) => (
  <div className='container server-container'>
    <select
      className='server-select'
      value={serverConfig.restURL}
      onChange={(e) => {
        const server = servers.find(s => s.restURL === e.target.value)
        onServerChange(server)
      }}
    >
      {servers.map(s => (
        <option key={s.restURL} value={s.restURL}>{s.label}</option>
      ))}
    </select>
    <button
      className='connect-button'
      onClick={onConnect}
      disabled={connecting}
    >
      {connecting ? 'Connecting...' : 'Connect'}
    </button>
  </div>
)

export default ServerSelector
