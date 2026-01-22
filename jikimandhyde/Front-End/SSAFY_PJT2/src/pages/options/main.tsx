import { createRoot } from 'react-dom/client';
import OptionsApp from './App';

const Options = () => {
  return <OptionsApp />;
};

export default Options;

createRoot(document.getElementById('root')!).render(<Options />);
