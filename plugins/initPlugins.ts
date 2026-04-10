import { deskPluginManager } from './DeskPluginManager'
import {
  DateCardPlugin,
  AnnouncementCardPlugin,
  WeatherCardPlugin,
  SloganCardPlugin,
  TimeCardPlugin,
  GreetingCardPlugin,
  QuickNotesCardPlugin,
  CountdownCardPlugin,
} from './builtins'

let initialized = false

export function initDeskPlugins(): void {
  if (initialized) return
  initialized = true

  deskPluginManager.loadBuiltin(new DateCardPlugin())
  deskPluginManager.loadBuiltin(new AnnouncementCardPlugin())
  deskPluginManager.loadBuiltin(new WeatherCardPlugin())
  deskPluginManager.loadBuiltin(new SloganCardPlugin())
  deskPluginManager.loadBuiltin(new TimeCardPlugin())
  deskPluginManager.loadBuiltin(new GreetingCardPlugin())
  deskPluginManager.loadBuiltin(new QuickNotesCardPlugin())
  deskPluginManager.loadBuiltin(new CountdownCardPlugin())
}
