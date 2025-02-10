"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

const ProgressBarProvider = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			{children}
			<ProgressBar
				height="2px"
				color="gray"
				options={{ showSpinner: false }}
				shallowRouting
			/>
		</>
	);
};

export default ProgressBarProvider;
