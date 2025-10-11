import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import { fetchNarratorVoices } from '../lib/api.js';

const defaultValues = {
  theme: 'Friendship between unlikely heroes',
  storyDetails: '', // User's custom story details
  genre: 'Adventure',
  targetAgeGroup: 'General',
  storyLength: 6,
  artStyle: 'storybook',
  mainCharacterName: 'Alex',
  mainCharacterGender: 'male',
  mainCharacterTraits: 'brave, curious',
  supportingCharacters: 'Sam | female | loyal, inventive',
  narrationTone: 'Warm narrator',
  narrationVoiceId: 'EkK5I93UQWFDigLMpZcX', // Default to James - Husky & Engaging
  narrationVoiceAlias: '',
  aspectRatio: '3:2',
  createAudio: true,
  createImages: true,
  useUserVoice: false,
  characterReferences: [], // Array of character reference images with IDs
};

const genres = ['Adventure', 'Fantasy', 'Mystery', 'Drama', 'Sci-Fi', 'Thriller', 'Romance', 'Comedy'];
const aspectRatios = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:2', label: 'Classic (3:2)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '21:9', label: 'Ultrawide (21:9)' }
];

const artStyles = [
  { value: 'storybook', label: 'Storybook' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'digital-painting', label: 'Digital Painting' },
  { value: 'paper-cut', label: 'Paper Cut' },
  { value: 'comic', label: 'Comic Book' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'anime', label: 'Anime' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'fantasy-art', label: 'Fantasy Art' }
];

const parseSupportingCharacters = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|');
      const namePart = parts[0]?.trim();
      const genderPart = parts[1]?.trim();
      const traitsPart = parts[2]?.trim() || parts[1]?.trim(); // If no gender specified, traits are in second part
      
      return {
        name: namePart,
        gender: genderPart && ['male', 'female', 'non-binary'].includes(genderPart.toLowerCase()) 
          ? genderPart.toLowerCase() 
          : 'non-binary', // Default to non-binary if not specified
        traits: traitsPart
          ? traitsPart
              .split(',')
              .map((trait) => trait.trim())
              .filter(Boolean)
          : [],
      };
    });
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unable to read file'));
        return;
      }
      const [, base64] = result.split('base64,');
      resolve(base64 ?? result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const StoryForm = ({ onGenerate, isLoading, latestError, submitLabel = 'Create story' }) => {
  const [uploadName, setUploadName] = useState(null);
  const [narratorVoices, setNarratorVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [characterReferences, setCharacterReferences] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues,
  });

  const createAudio = watch('createAudio');
  const createImages = watch('createImages');
  const useUserVoice = watch('useUserVoice');
  const mainCharacterName = watch('mainCharacterName');
  const supportingCharactersText = watch('supportingCharacters');
  
  // Parse supporting characters for display
  const supportingCharacters = parseSupportingCharacters(supportingCharactersText);
  const mainCharacter = {
    name: mainCharacterName || 'Alex',
    gender: watch('mainCharacterGender') || 'male',
    traits: watch('mainCharacterTraits') || 'brave, curious'
  };

  // Handle character reference image upload
  const handleCharacterReferenceUpload = async (characterName, file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      const newReference = {
        id: Date.now(), // Simple ID generation
        characterName,
        imageBase64: base64,
        fileName: file.name
      };
      
      setCharacterReferences(prev => {
        // Remove existing reference for this character if any
        const filtered = prev.filter(ref => ref.characterName !== characterName);
        return [...filtered, newReference];
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove character reference
  const removeCharacterReference = (characterName) => {
    setCharacterReferences(prev => prev.filter(ref => ref.characterName !== characterName));
  };

  // Load narrator voices on component mount
  useEffect(() => {
    const loadNarratorVoices = async () => {
      try {
        const voices = await fetchNarratorVoices();
        setNarratorVoices(voices);
      } catch (error) {
        console.error('Failed to load narrator voices:', error);
        // Fallback to default voices if API fails
        setNarratorVoices([
          {
            id: 'EkK5I93UQWFDigLMpZcX',
            name: 'James - Husky & Engaging',
            gender: 'male',
            description: 'Deep, engaging male voice perfect for adventure stories'
          }
        ]);
      } finally {
        setLoadingVoices(false);
      }
    };

    loadNarratorVoices();
  }, []);

  const submitHandler = async (values) => {
    const mainCharacter = {
      name: values.mainCharacterName,
      gender: values.mainCharacterGender,
      traits: values.mainCharacterTraits
        .split(',')
        .map((trait) => trait.trim())
        .filter(Boolean),
    };

    let voiceSampleBase64 = null;
    let voiceSampleFormat = null;

    const file = values.voiceSample?.[0];
    if (useUserVoice && file) {
      voiceSampleBase64 = await fileToBase64(file);
      voiceSampleFormat = file.type === 'audio/wav' ? 'wav' : 'mp3';
    }

    // Process character references with IDs
    const processedCharacterReferences = characterReferences.map((ref, index) => ({
      id: index + 1, // Assign sequential ID starting from 1
      characterName: ref.characterName,
      imageBase64: ref.imageBase64,
      fileName: ref.fileName
    }));

    const payload = {
      theme: values.theme,
      storyDetails: values.storyDetails || undefined, // User's custom story details
      genre: values.genre,
      targetAgeGroup: values.targetAgeGroup,
      storyLength: Number(values.storyLength) || 6,
      artStyle: values.artStyle,
      narrationTone: values.narrationTone,
      narrationVoiceAlias: values.narrationVoiceAlias || undefined,
      narrationVoiceId: values.narrationVoiceId || undefined,
      aspectRatio: values.aspectRatio,
      mainCharacter,
      supportingCharacters: parseSupportingCharacters(values.supportingCharacters),
      createAudio,
      createImages,
      useUserVoiceForNarration: useUserVoice && Boolean(voiceSampleBase64),
      voiceSampleBase64,
      voiceSampleFormat,
      characterReferences: processedCharacterReferences,
    };

    onGenerate(payload);
  };

  const handleReset = () => {
    reset(defaultValues);
    setUploadName(null);
    setValue('voiceSample', undefined);
    setCharacterReferences([]);
  };

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="space-y-6 rounded-xl bg-white p-6 shadow-lg"
    >
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Build your story</h2>
        <p className="text-sm text-slate-500">
          Create engaging stories with rich narratives, compelling characters, and cinematic visuals.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Theme or topic</span>
          <input
            type="text"
            {...register('theme', { required: 'Theme is required' })}
            placeholder="Friendship between unlikely heroes"
          />
          {errors.theme && <span className="text-xs text-red-500">{errors.theme.message}</span>}
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Story Details (Optional)
            <span className="ml-2 text-xs font-normal text-slate-500">Describe the story you want to create</span>
          </span>
          <textarea
            {...register('storyDetails')}
            rows={4}
            placeholder="Example: A brave knight embarks on a quest to save a kingdom from an ancient dragon. Along the way, they meet a wise wizard and a clever thief who join the adventure. The story should have exciting action scenes and moments of humor."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs text-slate-500">
            💡 The more details you provide, the more personalized your story will be
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Genre</span>
          <select {...register('genre')}>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Target audience</span>
          <select {...register('targetAgeGroup', { required: 'Target audience is required' })}>
            <option value="General">General</option>
            <option value="Young Adult">Young Adult</option>
            <option value="Adult">Adult</option>
            <option value="All Ages">All Ages</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Story length (pages)</span>
          <input
            type="number"
            min={1}
            max={12}
            {...register('storyLength', { valueAsNumber: true })}
          />
        </label>


      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Narrator voice</span>
        {loadingVoices ? (
          <div className="text-sm text-slate-500">Loading voices...</div>
        ) : (
          <select {...register('narrationVoiceId')}>
            {narratorVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} ({voice.gender}) - {voice.description}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-slate-400">Choose a narrator voice for your story</span>
      </label>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
        <legend className="text-sm font-semibold text-slate-700">Characters</legend>

        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Main character name</span>
            <input type="text" {...register('mainCharacterName', { required: true })} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Main character gender</span>
            <select {...register('mainCharacterGender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Main character traits</span>
            <input
              type="text"
              {...register('mainCharacterTraits')}
              placeholder="brave, curious"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Supporting characters</span>
            <textarea
              rows={3}
              {...register('supportingCharacters')}
              placeholder={'Name | gender | trait, trait\nExample: Sam | female | loyal, inventive'}
            />
            <span className="text-xs text-slate-400">One per line: Name | gender | traits (gender: male/female/non-binary)</span>
          </label>
        </div>

        {/* Character Reference Images */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700">Character Reference Images</h4>
          <p className="text-xs text-slate-500">
            Upload reference images for each character to maintain visual consistency across all scenes.
            Each character will be assigned a unique ID (1, 2, 3...) to prevent mixing.
          </p>
          
          {/* Main Character Reference */}
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {mainCharacter.name} (Main Character) - ID: 1
              </span>
              {characterReferences.find(ref => ref.characterName === mainCharacter.name) && (
                <button
                  type="button"
                  onClick={() => removeCharacterReference(mainCharacter.name)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleCharacterReferenceUpload(mainCharacter.name, e.target.files[0])}
              className="text-xs"
            />
            
            {characterReferences.find(ref => ref.characterName === mainCharacter.name) && (
              <div className="mt-2">
                <img
                  src={characterReferences.find(ref => ref.characterName === mainCharacter.name)?.imageBase64}
                  alt={`${mainCharacter.name} reference`}
                  className="h-20 w-20 rounded border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>

          {/* Supporting Characters References */}
          {supportingCharacters.map((char, index) => (
            <div key={char.name} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {char.name} (Supporting) - ID: {index + 2}
                </span>
                {characterReferences.find(ref => ref.characterName === char.name) && (
                  <button
                    type="button"
                    onClick={() => removeCharacterReference(char.name)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCharacterReferenceUpload(char.name, e.target.files[0])}
                className="text-xs"
              />
              
              {characterReferences.find(ref => ref.characterName === char.name) && (
                <div className="mt-2">
                  <img
                    src={characterReferences.find(ref => ref.characterName === char.name)?.imageBase64}
                    alt={`${char.name} reference`}
                    className="h-20 w-20 rounded border border-slate-200 object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
        <legend className="text-sm font-semibold text-slate-700">Image Settings</legend>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Art style</span>
            <select {...register('artStyle')}>
              {artStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Choose the visual style for your story illustrations</span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Aspect ratio</span>
            <select {...register('aspectRatio')}>
              {aspectRatios.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Choose the image dimensions for your illustrations</span>
          </label>
        </div>

      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
        <legend className="text-sm font-semibold text-slate-700">Outputs</legend>

        <label className="flex items-center gap-3">
          <input type="checkbox" {...register('createAudio')} />
          <span className="text-sm text-slate-700">Mix narration, dialogue, and sound effects</span>
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" {...register('createImages')} />
          <span className="text-sm text-slate-700">Generate cinematic illustrations</span>
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
        <legend className="text-sm font-semibold text-slate-700">Narrator voice</legend>

        <label className="flex items-center gap-3">
          <input type="checkbox" {...register('useUserVoice')} />
          <span className="text-sm text-slate-700">Use my voice sample for narration</span>
        </label>

        <div className={clsx('flex flex-col gap-2', !useUserVoice && 'opacity-50')}>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav"
            {...register('voiceSample')}
            disabled={!useUserVoice}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setUploadName(file.name);
              } else {
                setUploadName(null);
              }
            }}
          />
          {uploadName && <span className="text-xs text-slate-500">Selected: {uploadName}</span>}
        </div>
      </fieldset>

      {latestError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {latestError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </button>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default StoryForm;
