import * as vscode from 'vscode';
import axios from 'axios';

let statusBarItem: vscode.StatusBarItem;
enum State {
	Found,
	NotFound,
	NoFetchUrl
}
let itemState: State;

export function activate({ subscriptions }: vscode.ExtensionContext) {

	const command = 'codefactor.showRepoStats';
	subscriptions.push(vscode.commands.registerCommand(command, () => {
		if (itemState == State.Found)
		{
			vscode.env.openExternal(vscode.Uri.parse('https://www.codefactor.io'));
		}
		else if (itemState == State.NotFound)
		{
			vscode.window.showWarningMessage(`Repository was not found on CodeFactor. Please make sure it's public and reviewed.`);
		}
		else if (itemState == State.NoFetchUrl)
		{
			vscode.window.showWarningMessage(`Working folder is not a git repository.`);
		}
	}));

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = command;
	subscriptions.push(statusBarItem);
	subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(updateStatusBarItem));

     updateStatusBarItem();
}

function updateStatusBarItem(): void {
	const gitExtension = vscode.extensions.getExtension('vscode.git');
	var api = gitExtension?.exports.getAPI(1);

	api.onDidChangeState(() => {
		var repo = api.repositories[0];
		if (repo == undefined)
		{
			statusBarItem.text = `$(megaphone) -`;
			statusBarItem.show();
			itemState = State.NoFetchUrl;
			return;
		}
		var fetchUrl = repo.state.remotes[0]?.fetchUrl;
		var branchName = repo.state.HEAD.name;

		if (fetchUrl != null)
		{
			try {
				var url = `https://www.codefactor.io/home/repoMeta?cloneUrl=${fetchUrl}&branchName=${branchName}`;
				axios.get(url).then((resp) => {
					if (resp.status == 200 && resp.data?.issueCount != null)
					{
						statusBarItem.text = `$(megaphone) ${resp.data.grade}, ${resp.data.issueCount} issues`;
						statusBarItem.show();
						itemState = State.Found;
					}
					else
					{
						statusBarItem.text = `$(megaphone) -`;
						statusBarItem.show();
						itemState = State.NotFound;
					}
				}).then(undefined, err => {
					statusBarItem.text = `$(megaphone) -`;
					statusBarItem.show();
					itemState = State.NotFound;
				 })
			} catch (exception) {
				statusBarItem.text = `$(megaphone) -`;
				statusBarItem.show();
				itemState = State.NotFound;
			}
		}
		else {
			statusBarItem.text = `$(megaphone) -`;
			statusBarItem.show();
			itemState = State.NoFetchUrl;
		}
	})
}
