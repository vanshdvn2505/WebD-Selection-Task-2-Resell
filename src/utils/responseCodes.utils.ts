import { Response } from "express";

export function response_400(res: Response, message: String){
    return res.status(400).json({
        Status:'400',
        message: message,
    })
}

export function response_200(res: Response, message?: String, data?: Object) {
    return res.status(200).json({
        Status: '200',
        message,
        data
    });
}

export function response_500(res: Response, log_message: String, err?: any) {
    var message = err != null ? `${log_message}: ${err}` : log_message;

    console.log(message);

    return res.status(500).json({
        Status: '500',
        error: `Something went wrong.\n${message}`,
        message: "Internal server error"
    });
}