import type { BaseItemDto } from '../types/items';

export interface BadgeInfo {
  type: string;
  label: string;
  colorClass: string;
}

export function extractMediaBadges(item: BaseItemDto): BadgeInfo[] {
  const badges: BadgeInfo[] = [];
  
  if (!item.MediaSources || item.MediaSources.length === 0) {
    return badges;
  }

  const source = item.MediaSources[0];
  const videoStream = source.MediaStreams?.find(s => s.Type === 'Video');
  const audioStreams = source.MediaStreams?.filter(s => s.Type === 'Audio');

  // --- Video Badges ---
  if (videoStream) {
    // Resolution
    if (videoStream.Width && videoStream.Width >= 3800) {
      badges.push({ type: '4k', label: '4K', colorClass: 'badge-gold' });
    } else if (videoStream.Width && videoStream.Width >= 1900) {
      badges.push({ type: '1080p', label: '1080p', colorClass: 'badge-silver' });
    } else if (videoStream.Width && videoStream.Width >= 1200) {
      badges.push({ type: '720p', label: '720p', colorClass: 'badge-bronze' });
    }

    // HDR / Dolby Vision
    if (videoStream.VideoDoViTitle || videoStream.Codec?.toLowerCase().includes('dovi') || videoStream.Profile?.toLowerCase().includes('dovi')) {
      badges.push({ type: 'dovi', label: 'Dolby Vision', colorClass: 'badge-dovi' });
    } else if (videoStream.VideoRange === 'HDR') {
      badges.push({ type: 'hdr', label: 'HDR', colorClass: 'badge-hdr' });
    }

    // Codec
    if (videoStream.Codec) {
      const codec = videoStream.Codec.toUpperCase();
      if (codec === 'HEVC' || codec === 'H265') {
        badges.push({ type: 'hevc', label: 'HEVC', colorClass: 'badge-standard' });
      } else if (codec === 'H264') {
        badges.push({ type: 'h264', label: 'H.264', colorClass: 'badge-standard' });
      } else if (codec === 'AV1') {
        badges.push({ type: 'av1', label: 'AV1', colorClass: 'badge-standard' });
      }
    }
  }

  // --- Audio Badges ---
  if (audioStreams && audioStreams.length > 0) {
    // Get primary audio stream
    const primaryAudio = audioStreams[source.DefaultAudioStreamIndex || 0] || audioStreams[0];
    const codec = primaryAudio.Codec?.toLowerCase() || '';
    const profile = primaryAudio.Profile?.toLowerCase() || '';

    // Atmos
    if (codec.includes('atmos') || profile.includes('atmos') || (primaryAudio.Title && primaryAudio.Title.toLowerCase().includes('atmos'))) {
      badges.push({ type: 'atmos', label: 'Dolby Atmos', colorClass: 'badge-atmos' });
    } 
    // DTS-HD / DTS:X
    else if (codec.includes('dts') && (profile.includes('ma') || profile.includes('hd'))) {
      badges.push({ type: 'dtshd', label: 'DTS-HD', colorClass: 'badge-dtshd' });
    } 
    else if (codec.includes('dts')) {
      badges.push({ type: 'dts', label: 'DTS', colorClass: 'badge-dtshd' });
    }
    // Dolby Digital / AC3
    else if (codec === 'ac3' || codec === 'eac3') {
      badges.push({ type: 'dolby', label: 'Dolby Audio', colorClass: 'badge-dovi' });
    } 
    // FLAC
    else if (codec === 'flac') {
      badges.push({ type: 'flac', label: 'FLAC', colorClass: 'badge-standard' });
    }

    // Channels
    if (primaryAudio.Title && primaryAudio.Title.includes('7.1')) {
      badges.push({ type: '7.1', label: '7.1', colorClass: 'badge-standard' });
    } else if (primaryAudio.Title && primaryAudio.Title.includes('5.1')) {
      badges.push({ type: '5.1', label: '5.1', colorClass: 'badge-standard' });
    }
  }

  return badges;
}
