import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LicensePlateRecognition } from '../types/pos';

export class LicensePlateService {
  private static instance: LicensePlateService;

  static getInstance(): LicensePlateService {
    if (!LicensePlateService.instance) {
      LicensePlateService.instance = new LicensePlateService();
    }
    return LicensePlateService.instance;
  }

  async requestCameraPermissions(): Promise<boolean> {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  async scanLicensePlate(imageUri: string): Promise<LicensePlateRecognition | null> {
    try {
      // In production, this would integrate with:
      // 1. Google ML Kit Text Recognition API
      // 2. AWS Rekognition
      // 3. Azure Computer Vision
      // 4. Custom trained model for Philippine plates
      
      // For now, using mock implementation with realistic behavior
      const mockResult = await this.mockLicensePlateRecognition(imageUri);
      
      // Validate the detected plate format
      if (mockResult && this.validatePhilippinePlate(mockResult.plateNumber)) {
        return {
          ...mockResult,
          plateNumber: this.formatPlateNumber(mockResult.plateNumber)
        };
      }
      
      return mockResult;
    } catch (error) {
      console.error('Error scanning license plate:', error);
      return null;
    }
  }

  async batchScanLicensePlates(imageUris: string[]): Promise<LicensePlateRecognition[]> {
    const results: LicensePlateRecognition[] = [];
    
    for (const uri of imageUris) {
      try {
        const result = await this.scanLicensePlate(uri);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error scanning image ${uri}:`, error);
        // Continue with other images
      }
    }
    
    return results;
  }

  async captureAndScan(): Promise<LicensePlateRecognition | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return await this.scanLicensePlate(result.assets[0].uri);
      }

      return null;
    } catch (error) {
      console.error('Error capturing and scanning:', error);
      throw error;
    }
  }

  async captureAndScanWithRetry(maxAttempts: number = 3): Promise<LicensePlateRecognition | null> {
    let bestResult: LicensePlateRecognition | null = null;
    let highestConfidence = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.captureAndScan();
        
        if (result && result.confidence > highestConfidence) {
          bestResult = result;
          highestConfidence = result.confidence;
        }

        // If we get high confidence, no need to retry
        if (result && result.confidence >= 0.90) {
          break;
        }

        // Ask user if they want to retry (except on last attempt)
        if (attempt < maxAttempts && result && result.confidence < 0.80) {
          // In a real implementation, you would show a dialog here
          console.log(`Attempt ${attempt}: Low confidence (${result.confidence}). Consider retrying.`);
        }

      } catch (error) {
        console.error(`Scan attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    return bestResult;
  }

  private async mockLicensePlateRecognition(imageUri: string): Promise<LicensePlateRecognition> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Mock Philippine license plate patterns with more realistic variations
    const mockPlates = [
      'ABC 1234', 'XYZ 5678', 'DEF 9012', 'GHI 3456', 'JKL 7890',
      'MNO 2468', 'PQR 1357', 'STU 9753', 'VWX 4680', 'YZA 1593',
      'BCD 7531', 'EFG 9642', 'HIJ 8520', 'KLM 3697', 'NOP 1478',
      // New format plates
      'ABCD 123', 'EFGH 456', 'IJKL 789', 'MNOP 012', 'QRST 345',
      // Motorcycle plates
      'AB 1234', 'CD 5678', 'EF 9012', 'GH 3456', 'IJ 7890',
    ];

    const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
    
    // Simulate varying confidence based on image quality factors
    let baseConfidence = 0.75 + Math.random() * 0.24; // 75-99% base confidence
    
    // Simulate lower confidence for certain conditions
    const qualityFactors = Math.random();
    if (qualityFactors < 0.1) {
      // Poor lighting or angle
      baseConfidence = Math.max(0.60, baseConfidence - 0.2);
    } else if (qualityFactors < 0.2) {
      // Partially obscured
      baseConfidence = Math.max(0.65, baseConfidence - 0.15);
    }

    // Simulate realistic bounding box variations
    const imageWidth = 800; // Assumed image width
    const imageHeight = 600; // Assumed image height
    const plateWidth = 180 + Math.random() * 40; // 180-220px width
    const plateHeight = 45 + Math.random() * 15; // 45-60px height
    const x = Math.random() * (imageWidth - plateWidth);
    const y = Math.random() * (imageHeight - plateHeight);

    return {
      plateNumber: randomPlate,
      confidence: Math.round(baseConfidence * 100) / 100, // Round to 2 decimal places
      boundingBox: {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(plateWidth),
        height: Math.round(plateHeight),
      },
      timestamp: new Date(),
      imageUri,
    };
  }

  validatePhilippinePlate(plateNumber: string): boolean {
    // Philippine license plate patterns:
    // Old format: ABC 123 or ABC 1234
    // New format: ABC 1234 or ABCD 123
    const patterns = [
      /^[A-Z]{3}\s\d{3}$/,     // ABC 123
      /^[A-Z]{3}\s\d{4}$/,     // ABC 1234
      /^[A-Z]{4}\s\d{3}$/,     // ABCD 123
    ];

    return patterns.some(pattern => pattern.test(plateNumber.toUpperCase()));
  }

  formatPlateNumber(plateNumber: string): string {
    // Ensure consistent formatting
    return plateNumber.toUpperCase().replace(/\s+/g, ' ').trim();
  }

  correctCommonOCRErrors(plateNumber: string): string {
    // Common OCR misreadings for license plates
    const corrections: Record<string, string> = {
      // Numbers that look like letters
      '0': 'O', '1': 'I', '5': 'S', '8': 'B',
      // Letters that look like numbers
      'O': '0', 'I': '1', 'S': '5', 'B': '8', 'Z': '2',
      // Common character confusions
      'G': '6', '6': 'G', 'D': '0', 'Q': '0',
    };

    let corrected = plateNumber.toUpperCase();
    
    // Apply corrections based on position (letters should be in first part, numbers in second)
    const parts = corrected.split(' ');
    if (parts.length === 2) {
      const [letters, numbers] = parts;
      
      // Correct letter part (should only contain letters)
      let correctedLetters = letters;
      for (const [wrong, right] of Object.entries(corrections)) {
        if (/\d/.test(wrong) && /[A-Z]/.test(right)) {
          correctedLetters = correctedLetters.replace(new RegExp(wrong, 'g'), right);
        }
      }
      
      // Correct number part (should only contain numbers)
      let correctedNumbers = numbers;
      for (const [wrong, right] of Object.entries(corrections)) {
        if (/[A-Z]/.test(wrong) && /\d/.test(right)) {
          correctedNumbers = correctedNumbers.replace(new RegExp(wrong, 'g'), right);
        }
      }
      
      corrected = `${correctedLetters} ${correctedNumbers}`;
    }
    
    return this.formatPlateNumber(corrected);
  }

  async scanWithOCRCorrection(imageUri: string): Promise<LicensePlateRecognition | null> {
    const result = await this.scanLicensePlate(imageUri);
    
    if (result) {
      const correctedPlate = this.correctCommonOCRErrors(result.plateNumber);
      
      // If correction was applied, reduce confidence slightly
      const confidenceAdjustment = correctedPlate !== result.plateNumber ? 0.05 : 0;
      
      return {
        ...result,
        plateNumber: correctedPlate,
        confidence: Math.max(0, result.confidence - confidenceAdjustment),
      };
    }
    
    return result;
  }
}