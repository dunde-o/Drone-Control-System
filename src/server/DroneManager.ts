import { Drone, Position, BasePosition } from './types'
import {
  EARTH_RADIUS,
  RANDOM_POSITION_MIN_DISTANCE,
  RANDOM_POSITION_MAX_DISTANCE,
  DRONE_STATUS,
  AIRBORNE_STATUSES
} from './constants'

export class DroneManager {
  private drones: Map<string, Drone> = new Map()
  private droneIdCounter: number = 0
  private basePosition: BasePosition

  constructor(basePosition: BasePosition) {
    this.basePosition = basePosition
  }

  setBasePosition(position: BasePosition): void {
    this.basePosition = position
  }

  getDrone(id: string): Drone | undefined {
    return this.drones.get(id)
  }

  getDronesArray(): Drone[] {
    return Array.from(this.drones.values())
  }

  getDroneCount(): number {
    return this.drones.size
  }

  hasDrones(): boolean {
    return this.drones.size > 0
  }

  forEach(callback: (drone: Drone) => void): void {
    this.drones.forEach(callback)
  }

  private createDrone(): Drone {
    const id = `drone-${++this.droneIdCounter}`

    return {
      id,
      name: `Drone ${this.droneIdCounter}`,
      position: {
        lat: this.basePosition.lat,
        lng: this.basePosition.lng
      },
      altitude: 0,
      status: DRONE_STATUS.IDLE,
      battery: 100,
      waypoints: []
    }
  }

  setDroneCount(count: number): void {
    const currentCount = this.drones.size
    const diff = count - currentCount

    if (diff > 0) {
      // Add drones
      for (let i = 0; i < diff; i++) {
        const drone = this.createDrone()
        this.drones.set(drone.id, drone)
      }
    } else if (diff < 0) {
      // Remove drones (remove from the end)
      const droneIds = Array.from(this.drones.keys())
      for (let i = 0; i < Math.abs(diff); i++) {
        const idToRemove = droneIds.pop()
        if (idToRemove) {
          this.drones.delete(idToRemove)
        }
      }
    }

    console.info(`[Server] Drone count updated: ${this.drones.size}`)
  }

  // 두 좌표 사이의 거리 계산 (Haversine formula, 미터 단위)
  calculateDistance(from: Position, to: Position): number {
    const dLat = ((to.lat - from.lat) * Math.PI) / 180
    const dLng = ((to.lng - from.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return EARTH_RADIUS * c
  }

  // 베이스 기준 5km ~ 10km 반경 내 랜덤 좌표 생성
  generateRandomPosition(): Position {
    const distance =
      RANDOM_POSITION_MIN_DISTANCE +
      Math.random() * (RANDOM_POSITION_MAX_DISTANCE - RANDOM_POSITION_MIN_DISTANCE)

    const bearing = Math.random() * 360

    const latOffset = (distance * Math.cos((bearing * Math.PI) / 180)) / EARTH_RADIUS
    const lngOffset =
      (distance * Math.sin((bearing * Math.PI) / 180)) /
      (EARTH_RADIUS * Math.cos((this.basePosition.lat * Math.PI) / 180))

    return {
      lat: this.basePosition.lat + (latOffset * 180) / Math.PI,
      lng: this.basePosition.lng + (lngOffset * 180) / Math.PI
    }
  }

  // 드론 이동 시뮬레이션
  simulateDroneMovement(drone: Drone, deltaTime: number, flySpeed: number): void {
    if (drone.waypoints.length === 0) {
      // 목표 지점이 없으면 hovering으로 전환
      drone.status = DRONE_STATUS.HOVERING
      console.info(`[Server] Drone ${drone.id} has no waypoints, now hovering`)
      return
    }

    const target = drone.waypoints[0]
    const distance = this.calculateDistance(drone.position, target)
    const moveDistance = flySpeed * deltaTime

    if (distance <= moveDistance) {
      // 목표 지점에 도달
      drone.position = { ...target }
      drone.waypoints.shift() // 첫 번째 waypoint 제거

      if (drone.waypoints.length === 0) {
        // returning 상태면 베이스에 도착했으므로 착륙
        if (
          drone.status === DRONE_STATUS.RETURNING ||
          drone.status === DRONE_STATUS.RETURNING_AUTO
        ) {
          drone.status = DRONE_STATUS.LANDING
          console.info(`[Server] Drone ${drone.id} reached base, now landing`)
        } else {
          drone.status = DRONE_STATUS.HOVERING
          console.info(`[Server] Drone ${drone.id} reached final waypoint, now hovering`)
        }
      } else {
        console.info(
          `[Server] Drone ${drone.id} reached waypoint, ${drone.waypoints.length} remaining`
        )
      }
    } else {
      // 목표 지점으로 이동
      const ratio = moveDistance / distance
      const dLat = target.lat - drone.position.lat
      const dLng = target.lng - drone.position.lng

      drone.position = {
        lat: drone.position.lat + dLat * ratio,
        lng: drone.position.lng + dLng * ratio
      }
    }
  }

  // 드론 상태 시뮬레이션
  simulateDrones(
    deltaTime: number,
    verticalSpeed: number,
    flySpeed: number,
    baseAltitude: number
  ): void {
    this.drones.forEach((drone) => {
      switch (drone.status) {
        case DRONE_STATUS.ASCENDING:
          // 수직 속도에 따라 고도 상승
          drone.altitude += verticalSpeed * deltaTime

          // 적정 고도 도달 시 hovering 상태로 전환
          if (drone.altitude >= baseAltitude) {
            drone.altitude = baseAltitude
            drone.status = DRONE_STATUS.HOVERING
            console.info(
              `[Server] Drone ${drone.id} reached target altitude (${baseAltitude}m), now hovering`
            )
          }
          break

        case DRONE_STATUS.MOVING:
        case DRONE_STATUS.RETURNING:
        case DRONE_STATUS.RETURNING_AUTO:
          this.simulateDroneMovement(drone, deltaTime, flySpeed)
          break

        case DRONE_STATUS.LANDING:
        case DRONE_STATUS.LANDING_AUTO:
          // 착륙 시 고도 하강
          drone.altitude -= verticalSpeed * deltaTime

          // 지상 도달 시 idle 상태로 전환
          if (drone.altitude <= 0) {
            drone.altitude = 0
            drone.status = DRONE_STATUS.IDLE
            drone.waypoints = []
            console.info(`[Server] Drone ${drone.id} landed, now idle`)
          }
          break
      }
    })
  }

  // 모든 idle 드론 이륙
  takeoffAll(): number {
    let count = 0
    this.drones.forEach((drone) => {
      if (drone.status === DRONE_STATUS.IDLE) {
        drone.status = DRONE_STATUS.ASCENDING
        count++
      }
    })
    console.info(`[Server] All takeoff: ${count} drones ascending`)
    return count
  }

  // 모든 공중 드론 복귀
  returnAllToBase(): number {
    let count = 0
    this.drones.forEach((drone) => {
      if (AIRBORNE_STATUSES.includes(drone.status)) {
        drone.status = DRONE_STATUS.RETURNING
        drone.waypoints = [{ ...this.basePosition }]
        count++
      }
    })
    console.info(`[Server] All return to base: ${count} drones returning`)
    return count
  }

  // 모든 공중 드론 랜덤 이동
  randomMoveAll(): number {
    let count = 0
    this.drones.forEach((drone) => {
      if (AIRBORNE_STATUSES.includes(drone.status)) {
        const randomPos = this.generateRandomPosition()
        drone.status = DRONE_STATUS.MOVING
        drone.waypoints = [randomPos]
        count++
      }
    })
    console.info(`[Server] All random move: ${count} drones moving`)
    return count
  }
}
