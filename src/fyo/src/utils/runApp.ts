import cmd from './cmd';

export default function runApp(app) {
    const result = new cmd('am', ['start', '--user', '0', '-a', 'android.intent.action.MAIN', app + '/.MainActivity']);
    result.run();
}