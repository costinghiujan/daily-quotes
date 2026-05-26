import { Audio, AVPlaybackSource } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';

type TrackName = 'rain' | 'lofi';

export class AudioService {
  private static instance: AudioService;
  private sound: Audio.Sound | null = null;
  private isMuted: boolean = false;
  private currentTrack: TrackName | null = null;
  private appStateSubscription: any = null;

  private constructor() {
    this.setupAppStateListener();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && this.currentTrack && !this.isMuted) {
      this.resume();
    } else if (nextAppState.match(/inactive|background/)) {
      this.pause();
    }
  };

  private getTrackSource(track: TrackName): AVPlaybackSource {
    switch (track) {
      case 'rain':
        return require('../../assets/audio/rain.mp3');
      case 'lofi':
        return require('../../assets/audio/lofi.mp3');
      default:
        return require('../../assets/audio/rain.mp3');
    }
  }

  async play(track: TrackName = 'rain') {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const source = this.getTrackSource(track);
      const { sound: newSound } = await Audio.Sound.createAsync(source, {
        isLooping: true,
        volume: this.isMuted ? 0 : 0.3,
        shouldPlay: true,
      });

      this.sound = newSound;
      this.currentTrack = track;
    } catch (error) {
      console.error('[AudioService] Error playing audio:', error);
    }
  }

  async pause() {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('[AudioService] Error pausing audio:', error);
    }
  }

  async resume() {
    try {
      if (this.sound && !this.isMuted) {
        await this.sound.playAsync();
      }
    } catch (error) {
      console.error('[AudioService] Error resuming audio:', error);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.sound) {
      this.sound.setVolumeAsync(this.isMuted ? 0 : 0.3);
    }
  }

  getMutedState(): boolean {
    return this.isMuted;
  }

  async stop() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.currentTrack = null;
    } catch (error) {
      console.error('[AudioService] Error stopping audio:', error);
    }
  }

  cleanup() {
    this.stop();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}
