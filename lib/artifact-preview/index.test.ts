import { describe, it, expect } from 'vitest';
import { resolveArtifactKind, canEmbedPdf, kindLabel } from './index';

const art = (over: Partial<{ name: string; type: string; data: string }>) => ({
  name: 'file',
  type: '',
  data: '',
  ...over,
});

describe('resolveArtifactKind', () => {
  it('trusts the stored mime type first', () => {
    expect(resolveArtifactKind(art({ type: 'image/png' }))).toBe('image');
    expect(resolveArtifactKind(art({ type: 'application/pdf' }))).toBe('pdf');
    expect(resolveArtifactKind(art({ type: 'video/mp4' }))).toBe('video');
    expect(resolveArtifactKind(art({ type: 'audio/mpeg' }))).toBe('audio');
  });

  it('falls back to the file extension when the mime type is empty (e.g. iOS HEIC)', () => {
    expect(resolveArtifactKind(art({ name: 'IMG_0042.HEIC' }))).toBe('image');
    expect(resolveArtifactKind(art({ name: 'plan.pdf' }))).toBe('pdf');
  });

  it('reads the extension out of a Firebase Storage download URL', () => {
    const url =
      'https://firebasestorage.googleapis.com/v0/b/x.appspot.com/o/artifacts%2Fuid%2Fabc.pdf?alt=media&token=t';
    expect(resolveArtifactKind(art({ name: 'no-extension', data: url }))).toBe('pdf');
  });

  it('reads legacy inline data URLs', () => {
    expect(resolveArtifactKind(art({ name: 'x', data: 'data:image/jpeg;base64,AAAA' }))).toBe('image');
    expect(resolveArtifactKind(art({ name: 'x', data: 'data:application/pdf;base64,AAAA' }))).toBe('pdf');
  });

  it('is "other" when nothing identifies the file', () => {
    expect(resolveArtifactKind(art({ name: 'notes.docx' }))).toBe('other');
    expect(resolveArtifactKind(art({ name: 'mystery' }))).toBe('other');
  });
});

describe('canEmbedPdf', () => {
  it('blocks iPhone, iPad and iPadOS-as-Mac', () => {
    expect(canEmbedPdf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(false);
    expect(canEmbedPdf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 5)).toBe(false);
    expect(canEmbedPdf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(false);
  });
  it('allows desktop browsers', () => {
    expect(canEmbedPdf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(true);
    expect(canEmbedPdf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0)).toBe(true);
  });
});

describe('kindLabel', () => {
  it('labels each kind', () => {
    expect(kindLabel('pdf')).toBe('PDF');
    expect(kindLabel('other')).toBe('File');
  });
});
