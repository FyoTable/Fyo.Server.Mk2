import { Router, Route } from 'electron-router-dom'

import { MainScreen, AboutScreen, AnotherScreen } from 'renderer/screens'
import { WindowBar } from 'renderer/components'

export function AppRoutes() {
  return (
    <div>
      <WindowBar />
      <div style={{marginTop: '30px'}}>
        <Router
          main={
            <>
              <Route path="/" element={<MainScreen />} />
              <Route path="/anotherScreen" element={<AnotherScreen />} />
            </>
          }
          about={<Route path="/" element={<AboutScreen />} />}
        />
      </div>
    </div>
  )
}
