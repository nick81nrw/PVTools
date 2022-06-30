/*
import {RequestHandler} from "express";
import {transport} from "../misc/transport";

export const processContactRequest: RequestHandler = ((req, res, next) => {
    const data = req.body;

    let messageBoss = {
        from: process.env.SMTP_USER || '',
        to: process.env.COMPANY_RECIPIENT || "",
        subject: 'Neue Kontaktformular Nachricht',
        template: 'boss',
        context: {
            email: data.email,
            firstName: data.firstName ? ' ' + data.firstName : '',
            lastName: data.lastName ? ' ' + data.lastName : '',
            message: data.message,
        }
    }
    let messageUser = {
        from: process.env.SMTP_USER || '',
        to: data.email,
        subject: 'Neue Nachricht vom CMYK MEDIA Kontaktformular',
        template: 'user',
        context: {
            email: data.email,
            firstName: data.firstName ? ' ' + data.firstName : '',
            lastName: data.lastName ? ' ' + data.lastName : '',
            message: data.message,
        }
    }

    transport.sendMail(messageBoss)
        .then(info => {
            transport.sendMail(messageUser)
                .then(info => {
                    console.log("Messages sent to " + data.email)
                    res.status(200).send("Messages send")
                })
                .catch(error => {
                    console.log(error)
                    res.status(500).json(error)
                })
        })
        .catch(error => {
            console.log(error)
            res.status(500).json(error)
        });
})
*/
