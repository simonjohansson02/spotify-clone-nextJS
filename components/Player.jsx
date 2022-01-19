import {
	RewindIcon,
	PlayIcon,
	PauseIcon,
	FastForwardIcon,
	ReplyIcon,
	SwitchHorizontalIcon,
	VolumeUpIcon
} from '@heroicons/react/solid';
import { HeartIcon, VolumeUpIcon as VolumeDownIcon } from '@heroicons/react/outline';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { currentTrackIdState, isPlayingState } from '../atoms/songAtom';
import useSongInfo from '../hooks/useSongInfo';
import useSpotify from '../hooks/useSpotify';
import { debounce } from 'lodash';

const Player = () => {
	const spotifyApi = useSpotify();
	const { data: session, status } = useSession();

	const [currentTrackId, setCurrentTrackId] = useRecoilState(currentTrackIdState);
	const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
	const [volume, setVolume] = useState(50);
	const [songInfo1, setSongInfo1] = useState({});
	const songInfo = useSongInfo();

	const fetchCurrentSong = () => {
		if (!songInfo) {
			spotifyApi.getMyCurrentPlayingTrack().then((data) => {
				console.log('Now playing: ', data.body?.item);
				setCurrentTrackId(data.body?.item?.id);

				spotifyApi.getMyCurrentPlaybackState().then((data) => {
					setIsPlaying(data.body?.is_playing);
				});
			});
		}
	};

	const handlePlayPause = () => {
		spotifyApi.getMyCurrentPlaybackState().then(async (data) => {
			if (data.body.is_playing) {
				spotifyApi.pause();
				setIsPlaying(false);
			} else {
				spotifyApi.play();
				setIsPlaying(true);
			}
		});
	};

	// testing updateSongInfo
	const updateSongInfo = async () => {
		const currentSong = await spotifyApi.getMyCurrentPlayingTrack();
		console.log('currentsong', currentSong.body);
		const item = currentSong.body.item;
		const duration = item.duration_ms / 1000;
		const progress = currentSong.body.progress_ms / 1000;
		setSongInfo1({
			title: item.name,
			image: item.album.images[1],
			artist: item.artists[0].name,
			duration: item.duration_ms / 1000
		});
		// setSongProgress(progress);
	};
	console.log('songinfo1', songInfo1);

	const togglePlay = async (isPlaying) => {
		if (!isPlaying) {
			try {
				const transferPlayback = await spotifyApi.transferMyPlayback([deviceId]);
				console.log({ transferPlayback });

				const tryToPlay = await spotifyApi.play();
				console.log({ tryToPlay });
				updateSongInfo();
			} catch (e) {
				console.error(e);
			}
		} else {
			const tryToPause = await spotifyApi.pause();
			console.log({ tryToPause });
		}
	};

	useEffect(() => {
		if (spotifyApi.getAccessToken() && !currentTrackId) {
			fetchCurrentSong();
			setVolume(50);
		}
	}, [currentTrackId, spotifyApi, session]);

	useEffect(() => {
		if (volume > 0 && volume < 100) {
			debouncedAdjustVolume(volume);
		}
	}, [volume]);

	const debouncedAdjustVolume = useCallback(
		debounce((volume) => {
			spotifyApi.setVolume(volume).catch((error) => {});
		}, 250),
		[]
	);

	return (
		<div className="h-24 bg-gradient-to-b from-black to-gray-900 text-white grid grid-cols-3 text-xs md:text-base px-2 md:px-8">
			{/* Left */}
			<div className="flex items-center space-x-4 ">
				<img src={songInfo?.album.images?.[0]?.url} alt="" className="hidden md:inline h-10 w-10" />
				<div>
					<h3>{songInfo?.name}</h3>
					<p>{songInfo?.artists?.[0].name}</p>
				</div>
			</div>

			{/* Center */}
			<div className="flex items-center justify-evenly">
				<SwitchHorizontalIcon
					className="button"
					onClick={() => {
						//TODO Fix so if its true then its sets to false next click
						spotifyApi.setShuffle(true).then(
							function () {
								console.log('Shuffle is on.');
							},
							function (err) {
								//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
								console.log('Something went wrong!', err);
							}
						);
					}}
				/>
				<RewindIcon
					className="button"
					onClick={async () => {
						console.log('Skip prev');
						setIsPlaying(true);
						await spotifyApi.skipToPrevious();
						updateSongInfo();
					}}
				/>
				{isPlaying ? (
					<PauseIcon className="button w-10 h-10" onClick={handlePlayPause} />
				) : (
					<PlayIcon className="button w-10 h-10" onClick={handlePlayPause} />
				)}
				<FastForwardIcon
					className="button"
					onClick={async () => {
						console.log('Skip next');
						setIsPlaying(true);
						await spotifyApi.skipToNext();
						updateSongInfo();
					}}
				/>
				<ReplyIcon
					className="button"
					onClick={() => {
						//TODO Fix so after 2 clicks its resets to no repeat option
						spotifyApi.setRepeat('track').then(
							function () {
								console.log('Repeat track.');
							},
							function (err) {
								//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
								console.log('Something went wrong!', err);
							}
						);
					}}
				/>
			</div>

			{/* Right */}
			<div className="flex items-center space-x-3 md:space-x-4 justify-end">
				<VolumeDownIcon className="button" onClick={() => volume > 0 && setVolume(volume - 10)} />
				<input
					type="range"
					value={volume}
					min={0}
					max={100}
					onChange={(e) => setVolume(Number(e.target.value))}
					className="w-14 md:w-28"
				/>
				<VolumeUpIcon className="button" onClick={() => volume < 100 && setVolume(volume + 10)} />
			</div>
		</div>
	);
};

export default Player;
