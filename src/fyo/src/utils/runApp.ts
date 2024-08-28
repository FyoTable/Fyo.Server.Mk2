import cmd from './cmd';

export default function runApp(app) {
    try {
        const result = new cmd('am', ['start', '--user', '0', '-a', 'android.intent.action.MAIN', app + '/.MainActivity']);
        result.run().catch(console.error);
    } catch (e) {
        console.error(e);
    }
}