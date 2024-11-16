#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';
import { Command } from 'commander';
import { env } from 'process';

const program = new Command();

class Trackit{

    constructor(repoPath = '.'){
        this.repoPath = path.join(repoPath, '.trackit'); //create .trackit folder in repo
        this.objectsPath = path.join(this.repoPath, 'objects'); //create objects folder in .trackit i.e repo/.trackit/objects
        this.refsPath = path.join(this.repoPath, 'refs'); //create refs folder in .trackit i.e repo/.trackit/refs
        this.headPath = path.join(this.repoPath, 'HEAD'); //create HEAD folder in .trackit i.e repo/.trackit/HEAD
        this.indexPath = path.join(this.repoPath, 'index'); //create index folder in .trackit i.e repo/.trackit/index
        this.init();
    }

    async init(){
        //await fs.mkdir(this.repoPath, {recursive: true});
        await fs.mkdir(this.objectsPath, {recursive: true});
        try {
            await fs.writeFile(this.headPath, '', {flag: 'wx'}); //wx = open file for writing, but fail if the file already exists
            await fs.writeFile(this.indexPath, JSON.stringify([]), {flag: 'wx'});
        } catch (error) {
            console.log(".trackit already initialized");
        }

    }

    //function to create hash for a file
    hashObject(data){
        return crypto.createHash('sha1').update(data, 'utf-8').digest('hex');
    }

    async add(file){
        const fileData = await fs.readFile(file, {encoding: 'utf-8'}); //reading file
        const fileHash = this.hashObject(fileData); //hashing the file
        //console.log(fileHash)
        const objectsPath = path.join(this.objectsPath, fileHash); //creating objects file inside objects folder
        await fs.writeFile(objectsPath, fileData); //writing file

        await this.updateStagingArea(file, fileHash);

        console.log(`Added ${file}`);
    } 

    async updateStagingArea(filePath, fileHash){
        const index = JSON.parse(await fs.readFile(this.indexPath, {encoding: 'utf-8'})); //reading index file
        if(index.includes(fileHash)){
            console.log("File already exists in staging area");
        }else{
            index.push({path : filePath, hash : fileHash});
            await fs.writeFile(this.indexPath, JSON.stringify(index)); //writing the updated index file
        }
        
    }

    async commit(message){
        const index = JSON.parse(await fs.readFile(this.indexPath, {encoding: 'utf-8'})); //reading index file
        const parentCommit = await this.getCurrentHead();
        const commitData = {
            timeStamp: new Date().toISOString(),
            message,
            files: index,
            parent: parentCommit
        };

        const commitHash = this.hashObject(JSON.stringify(commitData)); //hashing the commit

        const commitPath = path.join(this.objectsPath, commitHash); //creating objects file inside objects folder
        await fs.writeFile(commitPath, JSON.stringify(commitData)); //writing file

        await fs.writeFile(this.headPath, commitHash); //update the HEAD to poit to the new commit

        await fs.writeFile(this.indexPath, JSON.stringify([])); //clear the staging area
        console.log(`Commit successfully created ${commitHash}`);
    }

    async getCurrentHead(){
        try {
            return await fs.readFile(this.headPath, {encoding: 'utf-8'});
        } catch (error) {
            return null;
        }
    }

    async log(){
        let currenCommitHash = await this.getCurrentHead();
        while(currenCommitHash){
            //const commitPath = path.join(this.objectsPath, currenCommitHash);
            const commitData = JSON.parse(await fs.readFile(path.join(this.objectsPath, currenCommitHash), {encoding: 'utf-8'})); //reading index file
            //printing log of a commit i.e  commit hash, date, message
            console.log(`\nCommit: ${currenCommitHash} \nDate: ${commitData.timeStamp} \nMessage: ${commitData.message} \n`);
            currenCommitHash = commitData.parent;
        }
    }

    async showCommitDiff(commitHash){
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if(!commitData){
            console.log("Commit not found");
            return;
        }
        console.log(`Changes in commit ${commitHash}:`);

        for(const file of commitData.files){
            console.log(`- ${file.path}`);
            const fileContent = await this.getFileData(file.hash);
            console.log(fileContent);

            if(commitData.parent){
                //get parentcommit data
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const parentFileContent = await this.getParentFileContent(parentCommitData, file.path);
                if(parentFileContent !== undefined){
                    console.log(`\nDiff: `)
                    const diff = diffLines(parentFileContent, fileContent);
                    //console.log(diff);

                    diff.forEach(part => {
                        if(part.added){
                            process.stdout.write(chalk.green(`++ ${part.value}`));
                        }else if(part.removed){
                            process.stdout.write(chalk.red(`-- ${part.value}`));
                        }else{
                            process.stdout.write(chalk.gray(part.value));
                        }
                    })
                    console.log(); //new line
                }else{
                    console.log("New File Commit")
                }
            }else{
                console.log("First Commit")
            }
        }
    }

    async getParentFileContent(parentCommitData, filePath){
        const parentFile = parentCommitData.files.find(file => file.path === filePath);
        if(parentFile){
            return await this.getFileData(parentFile.hash);
        }
        return null;
    }


    async getCommitData(commitHash){
        const commitPath = path.join(this.objectsPath, commitHash);
        try {
            return await fs.readFile(commitPath, {encoding: 'utf-8'});
        } catch (error) {
            console.log("Falied to get commit data");
            return null;
        }
    }

    async getFileData(fileHash){
        const objectpath = path.join(this.objectsPath, fileHash);
        return fs.readFile(objectpath, {encoding: 'utf-8'});
    }
}

// (async () => {
//     const trackit = new Trackit();
//     //await trackit.add('file.txt');
//     //await trackit.commit('my third commit');
//     //await trackit.log();
//     await trackit.showCommitDiff('d6db41a72bea11024847240af6aba704ffe0b791');
// })();

program.command('init').action(async () => {
    const trackit = new Trackit();
});

program.command('add <file>').action(async (file) => {
    const trackit = new Trackit();
    await trackit.add(file);
});

program.command('commit <message>').action(async (message) => {
    const trackit = new Trackit();
    await trackit.commit(message);
});

program.command('log').action(async () => {
    const trackit = new Trackit();
    await trackit.log();
});

program.command('diff <commitHash>').action(async (commitHash) => {
    const trackit = new Trackit();
    await trackit.showCommitDiff(commitHash);
});

program.parse(process.argv);