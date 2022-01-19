import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { deviceIdState } from '../atoms/songAtom';
import Center from '../components/Center';
import Player from '../components/Player';
import Sidebar from '../components/Sidebar';
import spotifyApi from '../lib/spotify';

export default function Home() {
	const { data: session, status } = useSession();
	console.log('datadata', session);
	const [deviceId, setDeviceId] = useRecoilState(deviceIdState);

	const accessToken = session.user.accessToken;

	console.log(accessToken);
	console.log(session);
	console.log('deviceID', deviceId);

	useEffect(() => {
		spotifyApi.setAccessToken(accessToken);
		window.onSpotifyWebPlaybackSDKReady = () => {
			setupSpotifyConnect(accessToken, setDeviceId);
		};
	}, []);

	const setupSpotifyConnect = (accessToken, setDeviceId) => {
		console.log(deviceId);
		const player = new window.Spotify.Player({
			name: 'Web Playback SDK Quick Start Player',
			getOAuthToken: (cb) => {
				cb(accessToken);
			},
			volume: 0.5
		});

		// Ready
		player.addListener('ready', ({ device_id }) => {
			console.log('Ready with Device ID', device_id);
			setDeviceId(device_id);

			spotifyApi.transferMyPlayback([device_id]);
		});

		// Not Ready
		player.addListener('not_ready', ({ device_id }) => {
			console.log('Device ID has gone offline', device_id);
		});

		player.addListener('initialization_error', ({ message }) => {
			console.error(message);
		});

		player.addListener('authentication_error', ({ message }) => {
			console.error(message);
		});

		player.addListener('account_error', ({ message }) => {
			console.error(message);
		});

		player.connect();
	};

	return (
		<div className="bg-black h-screen overflow-hidden">
			<Head>
				<title>Spotify clone</title>
				{/* <link rel="icon" href="/favicon.ico" /> */}
			</Head>

			<main className="flex">
				{/* Sidebar */}
				<Sidebar />
				{/* Center */}
				<Center />
			</main>

			<div className="sticky bottom-0">
				{/* Player */}
				<Player />
			</div>
		</div>
	);
}

export async function getServerSideProps(context) {
	const session = await getSession(context);

	return {
		props: {
			session
		}
	};
}
