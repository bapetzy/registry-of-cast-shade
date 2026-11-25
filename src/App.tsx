import { LazyMotion, MotionConfig } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Bylaws } from './components/Bylaws'
import { Hero } from './components/Hero'
import { LeaseDesk } from './components/lease/LeaseDesk'
import { Nav } from './components/Nav'
import { NightFooter } from './components/NightFooter'
import { Registry } from './components/registry/Registry'
import { Survey } from './components/survey/Survey'
import { startAmbientSun } from './lib/ambientSun'
import { LeaseContext, type LeaseTarget } from './lib/lease'

const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default)

export default function App() {
  const [requested, setRequested] = useState<LeaseTarget | null>(null)
  const desk = useMemo(() => ({ requested, request: setRequested }), [requested])

  useEffect(() => startAmbientSun(), [])

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <LeaseContext.Provider value={desk}>
          <a className="skip-link" href="#survey">
            Skip to the survey
          </a>
          <Nav />
          <div className="page">
            <main id="top">
              <Hero />
              <Survey />
              <Registry />
              <LeaseDesk />
              <Bylaws />
            </main>
            <NightFooter />
          </div>
        </LeaseContext.Provider>
      </MotionConfig>
    </LazyMotion>
  )
}
