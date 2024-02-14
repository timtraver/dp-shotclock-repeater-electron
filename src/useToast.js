import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';

const useToast = (options) => {
    const [messageApi, contextHolder] = message.useMessage();
    const defaultKey = 'updatable';
    const defaultType = 'info';
    const defaultContent = null;
    const defaultDuration = 3;

    function handleOpen(options) {
        if (options) {
            const key = options.key || defaultKey;
            const type = options.type || defaultType;
            const content = options.content || defaultContent;
            const duration = options.duration || defaultDuration;

            message.open({
                key,
                type: type,
                content: content,
                ...(duration && { duration: duration }),
                style: {
                    color: '#fff',
                },
            });
        }
    }

    return {
        open: handleOpen,
        info: (options) => {
            if (typeof options === 'object') {
                const key = options.key || defaultKey;
                const content = options.content || defaultContent;
                const duration = options.duration || defaultDuration;

                message.info({
                    key,
                    content,
                    duration,
                });
            } else {
                message.info(options);
            }
        },
        success: (options) => {
            if (typeof options === 'object') {
                const key = options.key || defaultKey;
                const content = options.content || defaultContent;
                const duration = options.duration || defaultDuration;

                message.success({
                    key,
                    content,
                    duration,
                });
            } else {
                message.success(options);
            }
        },
        warning: (options) => {
            if (typeof options === 'object') {
                const key = options.key || defaultKey;
                const content = options.content || defaultContent;
                const duration = options.duration || defaultDuration;

                message.warning({
                    key,
                    content,
                    duration,
                });
            } else {
                message.warning(options);
            }
        },
        error: (options) => {
            if (typeof options === 'object') {
                const key = options.key || defaultKey;
                const content = options.content || defaultContent;
                const duration = options.duration || defaultDuration;

                message.error({
                    key,
                    content,
                    duration,
                });
            } else {
                message.error(options);
            }
        },
        loading: (options) => {
            console.log(options);
            if (typeof options === 'object') {
                const key = options.key || defaultKey;
                const content = options.content || defaultContent;

                message.loading({
                    key,
                    content,
                    duration: 0,
                });
            } else {
                message.loading(options);
            }
        },
    };
};

export default useToast;
