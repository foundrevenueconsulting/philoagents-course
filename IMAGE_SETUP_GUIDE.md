# Adding Images for Temperament Recognition

## Quick Setup (Local Images)

1. **Add your images to the public folder**:
   ```
   philoagents-nextjs/public/images/recognition-practice/
   ├── sample_1.jpg  (Choleric example)
   ├── sample_2.jpg  (Phlegmatic example) 
   ├── sample_3.jpg  (Sanguine example)
   ├── sample_4.jpg  (Melancholic example)
   └── sample_5.jpg  (Choleric complex example)
   ```

2. **Image Requirements**:
   - Format: JPG, PNG, or WebP
   - Size: Recommended 800x600px or similar aspect ratio
   - File size: Under 1MB each for fast loading
   - Clear facial expressions and/or body language

3. **Replace the current placeholder files** with your real images

## Advanced Setup (External Hosting)

### Option A: Cloudinary (Recommended)
1. Create a free Cloudinary account
2. Upload images with descriptive tags
3. Update image paths in the data file

### Option B: AWS S3
1. Create an S3 bucket
2. Upload images with public read access
3. Use the S3 URLs in your configuration

### Option C: Stock Photo APIs
1. Get API keys from Unsplash/Pexels
2. Create dynamic image fetching
3. Cache locally for performance

## Image Selection Guidelines

### Choleric Temperament Images
- **Characteristics**: Confident posture, direct eye contact, strong jaw, assertive stance
- **Examples**: Business leaders giving presentations, athletes in victory poses, people in animated discussions

### Phlegmatic Temperament Images  
- **Characteristics**: Relaxed posture, calm expression, gentle demeanor, peaceful stance
- **Examples**: People meditating, casual conversations, relaxed social settings

### Sanguine Temperament Images
- **Characteristics**: Bright expressions, animated gestures, social engagement, energetic poses
- **Examples**: People laughing in groups, animated storytellers, party/social situations

### Melancholic Temperament Images
- **Characteristics**: Thoughtful expressions, introspective poses, refined features, contemplative stance
- **Examples**: People reading, writing, in quiet reflection, artistic/intellectual settings

## Implementation Steps

1. **Gather/Purchase Images**: Use stock photos or hire a photographer
2. **Process Images**: Resize and optimize for web
3. **Replace Placeholders**: Update the 5 sample images
4. **Test Loading**: Ensure images load properly in the app
5. **Expand Dataset**: Add more images as needed

## Legal Considerations

- Ensure you have rights to use all images
- Consider model releases for recognizable faces
- Stock photos are safest for commercial use
- Creative Commons images require attribution

## Technical Considerations

- Use Next.js Image optimization for performance
- Consider lazy loading for large datasets
- Implement proper error handling for missing images
- Add alt text for accessibility