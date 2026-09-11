'use client';

import React, { useState, useEffect, useRef } from 'react';
import Button from '../../../../components/ui/Button';

export default function VoiceVideoSettingsPage() {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);

  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');

  // Hardware processing toggles
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  // Mic test
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Camera preview test
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Enumerate devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request temporary stream to unlock device labels if permitted
        const devices = await navigator.mediaDevices.enumerateDevices();
        const aInputs = devices.filter((d) => d.kind === 'audioinput');
        const aOutputs = devices.filter((d) => d.kind === 'audiooutput');
        const vInputs = devices.filter((d) => d.kind === 'videoinput');

        setAudioInputs(aInputs);
        setAudioOutputs(aOutputs);
        setVideoInputs(vInputs);

        if (aInputs[0]) setSelectedAudioInput(aInputs[0].deviceId);
        if (aOutputs[0]) setSelectedAudioOutput(aOutputs[0].deviceId);
        if (vInputs[0]) setSelectedVideoInput(vInputs[0].deviceId);
      } catch (err) {
        console.error('Failed to enumerate media devices:', err);
      }
    };

    if (typeof window !== 'undefined' && navigator?.mediaDevices) {
      getDevices();
    }

    return () => {
      stopMicTest();
      stopCameraTest();
    };
  }, []);

  // Mic test logic
  const startMicTest = async () => {
    try {
      setIsTestingMic(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
      });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error('Error starting mic test:', err);
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    setIsTestingMic(false);
    setMicLevel(0);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  };

  // Camera preview logic
  const startCameraTest = async () => {
    try {
      setIsTestingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error starting camera test:', err);
      setIsTestingCamera(false);
    }
  };

  const stopCameraTest = () => {
    setIsTestingCamera(false);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
      <div className="max-w-2xl space-y-8">
        {/* Header Block */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-1">
            <span>Cài đặt</span>
            <span>/</span>
            <span className="text-primary font-medium">Âm thanh & Video</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Thiết bị thoại & Video (WebRTC)
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Kiểm tra micro, camera và điều chỉnh thông số truyền phát WebRTC trực tiếp.
          </p>
        </div>

        {/* Audio Input Device (Microphone) */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Microphone (Thiết bị thu âm)</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Chọn nguồn micro để thu âm trong các cuộc gọi trực tiếp.
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">mic</span>
          </div>

          <select
            value={selectedAudioInput}
            onChange={(e) => setSelectedAudioInput(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
          >
            {audioInputs.length === 0 ? (
              <option value="">Không tìm thấy micro</option>
            ) : (
              audioInputs.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))
            )}
          </select>

          {/* Mic Volume Meter Test */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary">Cường độ âm lượng đầu vào</span>
              <Button
                variant={isTestingMic ? 'danger' : 'secondary'}
                size="sm"
                onClick={isTestingMic ? stopMicTest : startMicTest}
              >
                {isTestingMic ? 'Dừng kiểm tra' : 'Thử micro'}
              </Button>
            </div>

            <div className="w-full h-3 bg-background rounded-full border border-border overflow-hidden p-0.5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-75"
                style={{ width: `${isTestingMic ? micLevel : 0}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Audio Output Device (Speakers) */}
        {audioOutputs.length > 0 && (
          <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Loa & Tai nghe (Đầu ra)</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Chọn thiết bị phát âm thanh cuộc gọi.
                </p>
              </div>
              <span className="material-symbols-outlined text-text-secondary text-xl">volume_up</span>
            </div>

            <select
              value={selectedAudioOutput}
              onChange={(e) => setSelectedAudioOutput(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
            >
              {audioOutputs.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Speaker ${i + 1}`}
                </option>
              ))}
            </select>
          </section>
        )}

        {/* Video Input Device (Camera) & Live Stage */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Camera (Máy ảnh)</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Xem thử hình ảnh video trực tiếp trước khi bắt đầu cuộc gọi.
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">videocam</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedVideoInput}
              onChange={(e) => setSelectedVideoInput(e.target.value)}
              className="w-full sm:flex-1 bg-background border border-border rounded-lg p-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
            >
              {videoInputs.length === 0 ? (
                <option value="">Không tìm thấy camera</option>
              ) : (
                videoInputs.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))
              )}
            </select>

            <Button
              variant={isTestingCamera ? 'danger' : 'secondary'}
              size="sm"
              onClick={isTestingCamera ? stopCameraTest : startCameraTest}
            >
              {isTestingCamera ? 'Tắt camera xem trước' : 'Xem trước Camera'}
            </Button>
          </div>

          {/* Video Preview Box */}
          <div className="w-full h-48 sm:h-64 rounded-xl bg-background border border-border overflow-hidden relative flex items-center justify-center">
            {isTestingCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-text-secondary space-y-1">
                <span className="material-symbols-outlined text-3xl">videocam_off</span>
                <p className="text-xs">Camera đang tắt. Bấm "Xem trước Camera" để kiểm tra.</p>
              </div>
            )}
          </div>
        </section>

        {/* Audio Processing Toggles */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Xử lý âm thanh WebRTC nâng cao</h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Khử tiếng ồn (Noise Suppression)</p>
                <p className="text-[10px] text-text-secondary">
                  Lọc bỏ tạp âm bàn phím, quạt gió và tiếng ồn môi trường.
                </p>
              </div>
              <input
                type="checkbox"
                checked={noiseSuppression}
                onChange={(e) => setNoiseSuppression(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Triệt tiêu tiếng vọng (Echo Cancellation)</p>
                <p className="text-[10px] text-text-secondary">
                  Ngăn âm thanh từ loa dội lại vào micro trong khi đàm thoại.
                </p>
              </div>
              <input
                type="checkbox"
                checked={echoCancellation}
                onChange={(e) => setEchoCancellation(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Tự động cân bằng âm lượng (Auto Gain)</p>
                <p className="text-[10px] text-text-secondary">
                  Tự động điều chỉnh mức thu khi bạn nói quá nhỏ hoặc quá lớn.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoGainControl}
                onChange={(e) => setAutoGainControl(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
