import { supabase } from '@park-angel/shared/src/lib/supabase'

export interface VehicleType {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VehicleBrand {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VehicleModel {
  id: string
  brandId: string
  name: string
  year?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VehicleColor {
  id: string
  name: string
  hexCode?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Vehicle {
  id: string
  userId: string
  type: string
  brand: string
  model: string
  year: number
  color: string
  plateNumber: string
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateVehicleTypeData {
  name: string
  description?: string
}

export interface CreateVehicleBrandData {
  name: string
}

export interface CreateVehicleModelData {
  brandId: string
  name: string
  year?: number
}

export interface CreateVehicleColorData {
  name: string
  hexCode?: string
}

export class VehicleService {
  // Vehicle Types Management
  async getVehicleTypes(): Promise<VehicleType[]> {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch vehicle types: ${error.message}`)
    }

    return data.map(this.mapDatabaseVehicleTypeToModel)
  }

  async createVehicleType(data: CreateVehicleTypeData): Promise<VehicleType> {
    const { data: vehicleType, error } = await supabase
      .from('vehicle_types')
      .insert({
        name: data.name,
        description: data.description,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle type: ${error.message}`)
    }

    return this.mapDatabaseVehicleTypeToModel(vehicleType)
  }

  async updateVehicleType(id: string, updates: Partial<CreateVehicleTypeData>): Promise<VehicleType> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.name) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description

    const { data: vehicleType, error } = await supabase
      .from('vehicle_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle type: ${error.message}`)
    }

    return this.mapDatabaseVehicleTypeToModel(vehicleType)
  }

  async deleteVehicleType(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_types')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle type: ${error.message}`)
    }
  }

  // Vehicle Brands Management
  async getVehicleBrands(): Promise<VehicleBrand[]> {
    const { data, error } = await supabase
      .from('vehicle_brands')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch vehicle brands: ${error.message}`)
    }

    return data.map(this.mapDatabaseVehicleBrandToModel)
  }

  async createVehicleBrand(data: CreateVehicleBrandData): Promise<VehicleBrand> {
    const { data: vehicleBrand, error } = await supabase
      .from('vehicle_brands')
      .insert({
        name: data.name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle brand: ${error.message}`)
    }

    return this.mapDatabaseVehicleBrandToModel(vehicleBrand)
  }

  async updateVehicleBrand(id: string, updates: Partial<CreateVehicleBrandData>): Promise<VehicleBrand> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.name) updateData.name = updates.name

    const { data: vehicleBrand, error } = await supabase
      .from('vehicle_brands')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle brand: ${error.message}`)
    }

    return this.mapDatabaseVehicleBrandToModel(vehicleBrand)
  }

  async deleteVehicleBrand(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_brands')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle brand: ${error.message}`)
    }
  }

  // Vehicle Models Management
  async getVehicleModels(brandId?: string): Promise<VehicleModel[]> {
    let query = supabase
      .from('vehicle_models')
      .select('*')
      .eq('is_active', true)

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    const { data, error } = await query.order('name')

    if (error) {
      throw new Error(`Failed to fetch vehicle models: ${error.message}`)
    }

    return data.map(this.mapDatabaseVehicleModelToModel)
  }

  async createVehicleModel(data: CreateVehicleModelData): Promise<VehicleModel> {
    const { data: vehicleModel, error } = await supabase
      .from('vehicle_models')
      .insert({
        brand_id: data.brandId,
        name: data.name,
        year: data.year,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle model: ${error.message}`)
    }

    return this.mapDatabaseVehicleModelToModel(vehicleModel)
  }

  async updateVehicleModel(id: string, updates: Partial<CreateVehicleModelData>): Promise<VehicleModel> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.brandId) updateData.brand_id = updates.brandId
    if (updates.name) updateData.name = updates.name
    if (updates.year !== undefined) updateData.year = updates.year

    const { data: vehicleModel, error } = await supabase
      .from('vehicle_models')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle model: ${error.message}`)
    }

    return this.mapDatabaseVehicleModelToModel(vehicleModel)
  }

  async deleteVehicleModel(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_models')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle model: ${error.message}`)
    }
  }

  // Vehicle Colors Management
  async getVehicleColors(): Promise<VehicleColor[]> {
    const { data, error } = await supabase
      .from('vehicle_colors')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch vehicle colors: ${error.message}`)
    }

    return data.map(this.mapDatabaseVehicleColorToModel)
  }

  async createVehicleColor(data: CreateVehicleColorData): Promise<VehicleColor> {
    const { data: vehicleColor, error } = await supabase
      .from('vehicle_colors')
      .insert({
        name: data.name,
        hex_code: data.hexCode,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle color: ${error.message}`)
    }

    return this.mapDatabaseVehicleColorToModel(vehicleColor)
  }

  async updateVehicleColor(id: string, updates: Partial<CreateVehicleColorData>): Promise<VehicleColor> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.name) updateData.name = updates.name
    if (updates.hexCode !== undefined) updateData.hex_code = updates.hexCode

    const { data: vehicleColor, error } = await supabase
      .from('vehicle_colors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle color: ${error.message}`)
    }

    return this.mapDatabaseVehicleColorToModel(vehicleColor)
  }

  async deleteVehicleColor(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_colors')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle color: ${error.message}`)
    }
  }

  // User Vehicles Management
  async getUserVehicles(userId?: string): Promise<Vehicle[]> {
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch vehicles: ${error.message}`)
    }

    return data.map(this.mapDatabaseVehicleToModel)
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapDatabaseVehicleToModel(data)
  }

  // Private helper methods
  private mapDatabaseVehicleTypeToModel(dbType: any): VehicleType {
    return {
      id: dbType.id,
      name: dbType.name,
      description: dbType.description,
      isActive: dbType.is_active,
      createdAt: new Date(dbType.created_at),
      updatedAt: new Date(dbType.updated_at)
    }
  }

  private mapDatabaseVehicleBrandToModel(dbBrand: any): VehicleBrand {
    return {
      id: dbBrand.id,
      name: dbBrand.name,
      isActive: dbBrand.is_active,
      createdAt: new Date(dbBrand.created_at),
      updatedAt: new Date(dbBrand.updated_at)
    }
  }

  private mapDatabaseVehicleModelToModel(dbModel: any): VehicleModel {
    return {
      id: dbModel.id,
      brandId: dbModel.brand_id,
      name: dbModel.name,
      year: dbModel.year,
      isActive: dbModel.is_active,
      createdAt: new Date(dbModel.created_at),
      updatedAt: new Date(dbModel.updated_at)
    }
  }

  private mapDatabaseVehicleColorToModel(dbColor: any): VehicleColor {
    return {
      id: dbColor.id,
      name: dbColor.name,
      hexCode: dbColor.hex_code,
      isActive: dbColor.is_active,
      createdAt: new Date(dbColor.created_at),
      updatedAt: new Date(dbColor.updated_at)
    }
  }

  private mapDatabaseVehicleToModel(dbVehicle: any): Vehicle {
    return {
      id: dbVehicle.id,
      userId: dbVehicle.user_id,
      type: dbVehicle.type,
      brand: dbVehicle.brand,
      model: dbVehicle.model,
      year: dbVehicle.year,
      color: dbVehicle.color,
      plateNumber: dbVehicle.plate_number,
      isPrimary: dbVehicle.is_primary,
      createdAt: new Date(dbVehicle.created_at),
      updatedAt: new Date(dbVehicle.updated_at)
    }
  }
}

export const vehicleService = new VehicleService()