import * as vscode from 'vscode';
import axios from 'axios';

let statusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {

	const command = 'codefactor.showRepoStats';
	subscriptions.push(vscode.commands.registerCommand(command, () => {
		vscode.env.openExternal(vscode.Uri.parse('https://www.codefactor.io'));
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
		var fetchUrl = repo.state.remotes[0]?.fetchUrl;
		var branchName = repo.state.HEAD.name;

		if (fetchUrl != null)
		{
			try {
				var url = `https://www.codefactor.io/home/repoMeta?cloneUrl=${fetchUrl}&branchName=${branchName}`;
				axios.get(url).then((resp) => {
					if (resp.status == 200)
					{
						statusBarItem.text = `$(megaphone) ${resp.data.grade}, ${resp.data.issueCount} issues`;
						statusBarItem.show();
					}
					else {
						statusBarItem.hide();
					}
				});
			} catch (exception) {
				statusBarItem.hide();
			}
		}
		else {
			statusBarItem.hide();
		}
	})
}
