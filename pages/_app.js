import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import { RecoilRoot } from 'recoil';
import useSpotify from '../hooks/useSpotify';
import '../styles/globals.css';
import { useRecoilState, useRecoilValue } from 'recoil';
import { deviceIdState } from '../atoms/songAtom';
console.log(deviceIdState);
function MyApp({ Component, pageProps: { session, ...pageProps } }) {
	return (
		<>
			<Script src="https://sdk.scdn.co/spotify-player.js" />
			<SessionProvider session={session}>
				<RecoilRoot>
					<Component {...pageProps} />
				</RecoilRoot>
			</SessionProvider>
		</>
	);
}

export default MyApp;
