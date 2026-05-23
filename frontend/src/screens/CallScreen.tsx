import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  RTCView,
} from 'react-native-webrtc';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

const debuggerHost = Constants.expoConfig?.hostUri;
const dynamicIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const SOCKET_URL = `http://${dynamicIp}:3000`;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function CallScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { otherUserId, otherUsername, otherUserAvatar, isVideo } = route.params || {};

  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCaller, setIsCaller] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const remoteDescriptionSetRef = useRef(false);

  // Initialize socket and WebRTC
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join_own_room', user?.id);

    // Determine if we are the caller
    const caller = route.params?.initiator === 'me';
    setIsCaller(caller);

    const initWebRTC = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { facingMode: isFrontCamera ? 'user' : 'environment' } : false,
        });
        setLocalStream(stream);

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => {
          if (pc.signalingState !== 'closed') {
            pc.addTrack(track, stream);
          }
        });

        // Use the event-target-shim addEventListener via cast
        const pcEventTarget = pc as any;

        pcEventTarget.addEventListener('icecandidate', (event: any) => {
          if (event.candidate && socket.connected) {
            socket.emit('call_ice_candidate', {
              to: otherUserId,
              candidate: event.candidate,
            });
          }
        });

        pcEventTarget.addEventListener('track', (event: any) => {
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0];
            setRemoteStream(event.streams[0]);
          }
        });

        pcEventTarget.addEventListener('iceconnectionstatechange', () => {
          if (
            pc.iceConnectionState === 'disconnected' ||
            pc.iceConnectionState === 'failed' ||
            pc.iceConnectionState === 'closed'
          ) {
            endCall();
          }
        });

        if (caller) {
          // Caller creates offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call_offer', {
            to: otherUserId,
            offer,
            callerName: user?.username || 'Unknown',
            callerAvatar: user?.profile_picture_url || null,
            isVideo,
          });
          setCallStatus('calling');
        } else {
          setCallStatus('ringing');
        }
      } catch (error) {
        console.error('[WebRTC] Error initializing:', error);
        Alert.alert(t('common.error'), t('call.permissionError'));
        goBackSafe();
      }
    };

    initWebRTC();

    // Socket event handlers
    const flushPendingCandidates = async () => {
      if (!pcRef.current) return;
      const pending = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];
      for (const candidate of pending) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('[WebRTC] Error adding buffered ICE candidate:', error);
        }
      }
    };

    const handleOffer = async (data: { offer: any; callerName: string; callerAvatar: string | null; isVideo: boolean }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        remoteDescriptionSetRef.current = true;
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('call_answer', {
          to: otherUserId,
          answer,
        });
        setCallStatus('connected');
        setIsCallActive(true);
        // Flush any pending ICE candidates
        await flushPendingCandidates();
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
      }
    };

    const handleAnswer = async (data: { answer: any }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        remoteDescriptionSetRef.current = true;
        setCallStatus('connected');
        setIsCallActive(true);
        // Flush any pending ICE candidates
        await flushPendingCandidates();
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
      }
    };

    const handleIceCandidate = async (data: { candidate: any }) => {
      if (!pcRef.current) return;
      // Buffer candidates if remote description is not set yet
      if (!remoteDescriptionSetRef.current) {
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('[WebRTC] Error adding ICE candidate:', error);
      }
    };

    const handleEnded = () => {
      endCall();
    };

    const handleDeclined = () => {
      Alert.alert(t('call.declined'), t('call.declinedMessage'));
      goBackSafe();
    };

    const handleBusy = () => {
      Alert.alert(t('call.busy'), t('call.busyMessage'));
      goBackSafe();
    };

    socket.on('call_offer', handleOffer);
    socket.on('call_answer', handleAnswer);
    socket.on('call_ice_candidate', handleIceCandidate);
    socket.on('call_ended', handleEnded);
    socket.on('call_declined', handleDeclined);
    socket.on('user_busy', handleBusy);

    return () => {
      socket.off('call_offer', handleOffer);
      socket.off('call_answer', handleAnswer);
      socket.off('call_ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleEnded);
      socket.off('call_declined', handleDeclined);
      socket.off('user_busy', handleBusy);
      socket.disconnect();
      cleanupWebRTC();
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [callStatus]);

  const cleanupWebRTC = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
  };

  const goBackSafe = () => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs');
      }
    } catch {
      navigation.navigate('MainTabs');
    }
  };

  const endCall = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('call_end', { to: otherUserId });
    }
    cleanupWebRTC();
    setCallStatus('ended');
    goBackSafe();
  };

  const declineCall = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('call_decline', { to: otherUserId });
    }
    cleanupWebRTC();
    goBackSafe();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream && isVideo) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const switchCamera = async () => {
    if (localStream && isVideo) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        (videoTrack as any)._switchCamera();
        setIsFrontCamera(!isFrontCamera);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Remote video (full screen) - use key to force remount */}
      {isVideo && remoteStream ? (
        <RTCView
          key={`remote-${remoteStream.toURL()}`}
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.remoteVideoPlaceholder}>
          {otherUserAvatar ? (
            <Image source={{ uri: otherUserAvatar }} style={styles.avatarLarge} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="person" size={60} color={colors.primary} />
            </View>
          )}
        </View>
      )}

      {/* Local video (PiP) - use key to force remount */}
      {isVideo && localStream && (
        <View style={styles.localVideoContainer}>
          <RTCView
            key={`local-${localStream.toURL()}`}
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={isFrontCamera}
          />
        </View>
      )}

      {/* Call info overlay */}
      <View style={styles.callInfo}>
        <Text style={styles.callerName}>{otherUsername}</Text>
        <Text style={styles.callStatusText}>
          {callStatus === 'calling' && t('call.calling')}
          {callStatus === 'ringing' && t('call.ringing')}
          {callStatus === 'connected' && formatDuration(callDuration)}
          {callStatus === 'ended' && t('call.ended')}
        </Text>
      </View>

      {/* Control buttons */}
      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.controlsRow}>
          {isVideo && (
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonSecondary]}
              onPress={switchCamera}
            >
              <Ionicons name="camera-reverse" size={28} color={colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, isMuted ? styles.controlButtonActive : styles.controlButtonSecondary]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color={colors.white}
            />
          </TouchableOpacity>

          {isVideo && (
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonSecondary]}
              onPress={toggleCamera}
            >
              <Ionicons name="videocam" size={28} color={colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn ? styles.controlButtonActive : styles.controlButtonSecondary]}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-mute'}
              size={28}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.endCallRow}>
          {callStatus === 'ringing' && !isCaller && (
            <TouchableOpacity
              style={styles.declineButton}
              onPress={declineCall}
            >
              <Ionicons name="call" size={32} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={endCall}
          >
            <Ionicons name="call" size={32} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1a1a2e',
    },
    remoteVideo: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    remoteVideoPlaceholder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a1a2e',
    },
    avatarLarge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    localVideoContainer: {
      position: 'absolute',
      top: 60,
      right: 20,
      width: 120,
      height: 180,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    localVideo: {
      flex: 1,
    },
    callInfo: {
      position: 'absolute',
      top: 100,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    callerName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    callStatusText: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.7)',
    },
    controlsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 30,
      paddingHorizontal: 20,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginBottom: 30,
    },
    controlButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlButtonSecondary: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    controlButtonActive: {
      backgroundColor: colors.primary,
    },
    endCallRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 40,
      marginBottom: 10,
    },
    endCallButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
    declineButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
