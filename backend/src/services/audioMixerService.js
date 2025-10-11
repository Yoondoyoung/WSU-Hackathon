import { saveBase64Asset, saveBufferAsset } from '../utils/storage.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HttpError } from '../utils/errorHandlers.js';

// FFmpeg 경로 설정
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 실제 오디오 믹싱을 위한 개선된 서비스
 */
export const mixPageAudio = async ({ pageNumber, segments }) => {
  const usableSegment = segments.find((segment) => segment?.audioBase64);
  if (!usableSegment) {
    return null;
  }

  const { publicPath, publicUrl } = await saveBase64Asset({
    data: usableSegment.audioBase64,
    extension: 'mp3',
    directory: 'audio',
    fileName: `scene-${pageNumber}.mp3`,
  });

  return {
    publicPath,
    publicUrl,
  };
};

/**
 * 여러 오디오 버퍼를 순차적으로 믹싱하여 하나의 MP3 파일로 생성
 */
export const mixSequentialAudio = async (buffers) => {
  if (!buffers || buffers.length === 0) {
    return null;
  }
  
  if (buffers.length === 1) {
    return buffers[0];
  }

  try {
    // 임시 디렉토리 생성
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // 각 버퍼를 임시 파일로 저장
    const tempFiles = [];
    for (let i = 0; i < buffers.length; i++) {
      const tempFile = path.join(tempDir, `temp_${Date.now()}_${i}.mp3`);
      await fs.writeFile(tempFile, buffers[i]);
      tempFiles.push(tempFile);
    }

    // 출력 파일 경로
    const outputFile = path.join(tempDir, `mixed_${Date.now()}.mp3`);

    // FFmpeg를 사용하여 오디오 파일들을 순차적으로 연결
    await new Promise((resolve, reject) => {
      let command = ffmpeg();
      
      // 입력 파일들 추가
      tempFiles.forEach(file => {
        command = command.input(file);
      });

      command
        .on('end', () => {
          console.log('[audioMixer] Audio mixing completed successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('[audioMixer] FFmpeg error:', err);
          reject(new HttpError(500, 'Audio mixing failed', { error: err.message }));
        })
        .on('progress', (progress) => {
          console.log(`[audioMixer] Processing: ${progress.percent}% done`);
        })
        .complexFilter([
          // concat 필터를 사용하여 오디오들을 순차적으로 연결
          `concat=n=${tempFiles.length}:v=0:a=1[out]`
        ])
        .outputOptions(['-map', '[out]'])
        .output(outputFile)
        .run();
    });

    // 결과 파일 읽기
    const mixedBuffer = await fs.readFile(outputFile);

    // 임시 파일들 정리
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (err) {
        console.warn(`[audioMixer] Failed to delete temp file ${file}:`, err.message);
      }
    }
    
    try {
      await fs.unlink(outputFile);
    } catch (err) {
      console.warn(`[audioMixer] Failed to delete output file ${outputFile}:`, err.message);
    }

    return mixedBuffer;

  } catch (error) {
    console.error('[audioMixer] Audio mixing failed:', error);
    
    // FFmpeg 실패 시 첫 번째 버퍼만 반환 (fallback)
    console.warn('[audioMixer] Falling back to first buffer only');
    return buffers[0];
  }
};

/**
 * 오디오와 SFX를 동시에 믹싱 (오버레이)
 */
export const mixAudioWithSFX = async (audioBuffer, sfxBuffer, sfxVolume = 0.3) => {
  if (!audioBuffer || !sfxBuffer) {
    return audioBuffer || sfxBuffer;
  }

  try {
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const audioFile = path.join(tempDir, `audio_${Date.now()}.mp3`);
    const sfxFile = path.join(tempDir, `sfx_${Date.now()}.mp3`);
    const outputFile = path.join(tempDir, `mixed_with_sfx_${Date.now()}.mp3`);

    // 버퍼들을 임시 파일로 저장
    await fs.writeFile(audioFile, audioBuffer);
    await fs.writeFile(sfxFile, sfxBuffer);

    // FFmpeg를 사용하여 오디오와 SFX 믹싱
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(audioFile)
        .input(sfxFile)
        .complexFilter([
          `[1:a]volume=${sfxVolume}[sfx_vol]`,
          `[0:a][sfx_vol]amix=inputs=2:duration=first:dropout_transition=2[out]`
        ])
        .outputOptions(['-map', '[out]'])
        .output(outputFile)
        .on('end', () => {
          console.log('[audioMixer] Audio with SFX mixing completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('[audioMixer] SFX mixing error:', err);
          reject(new HttpError(500, 'SFX mixing failed', { error: err.message }));
        })
        .run();
    });

    const mixedBuffer = await fs.readFile(outputFile);

    // 임시 파일들 정리
    [audioFile, sfxFile, outputFile].forEach(async (file) => {
      try {
        await fs.unlink(file);
      } catch (err) {
        console.warn(`[audioMixer] Failed to delete temp file ${file}:`, err.message);
      }
    });

    return mixedBuffer;

  } catch (error) {
    console.error('[audioMixer] SFX mixing failed:', error);
    return audioBuffer; // SFX 믹싱 실패 시 원본 오디오만 반환
  }
};

export const saveSoundEffectBuffer = async ({ pageNumber, buffer }) => {
  if (!buffer) {
    return null;
  }

  const { publicPath, publicUrl } = await saveBufferAsset({
    buffer,
    extension: 'mp3',
    directory: 'audio/sfx',
    fileName: `scene-${pageNumber}-sfx.mp3`,
  });

  return {
    publicPath,
    publicUrl,
  };
};