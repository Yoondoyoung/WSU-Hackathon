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
};

const genres = ['Adventure', 'Fantasy', 'Mystery', 'Drama', 'Sci-Fi', 'Thriller', 'Romance', 'Comedy'];
const aspectRatios = ['1:1', '4:3', '3:2', '16:9'];
const artStyles = ['storybook', 'watercolor', 'digital-painting', 'paper-cut', 'comic', 'photorealistic', 'oil-painting', 'sketch'];

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
    };

    onGenerate(payload);
  };

  const handleReset = () => {
    reset(defaultValues);
    setUploadName(null);
    setValue('voiceSample', undefined);
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
          <span className="text-sm font-medium text-slate-700">Art style</span>
          <select {...register('artStyle')}>
            {artStyles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Aspect ratio</span>
          <select {...register('aspectRatio')}>
            {aspectRatios.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
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
