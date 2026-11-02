export interface BannerProps {
  text?: string;
  backgroundColor?: string;
}

// One input to try the Banner with. Missing keys mean the prop isn't passed.
export interface BannerCase extends BannerProps {
  id: string;
  // True when the Banner should render nothing visible (requirement 4).
  expectEmpty?: boolean;
}
