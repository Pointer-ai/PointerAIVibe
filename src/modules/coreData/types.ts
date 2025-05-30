export interface CoreDataEvent {
  id: string
  type: string
  timestamp: string
  details: Record<string, any>
}

export interface CoreData {
  events: CoreDataEvent[]
}
